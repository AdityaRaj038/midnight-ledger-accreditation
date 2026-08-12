"use client";

import {
  ContractMaintenanceAuthority,
  ContractOperation,
  ContractState,
  sampleSigningKey,
  signatureVerifyingKey,
  type SigningKey,
} from "@midnight-ntwrk/ledger-v8";
import { createConstructorContext } from "@midnight-ntwrk/compact-runtime";
import { Intent, ContractDeploy, Transaction } from "@midnight-ntwrk/ledger-v8";
import { getNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { ttlOneHour } from "@midnight-ntwrk/midnight-js-utils";

type BrowserContract = {
  constructor: new (witnesses: unknown) => {
    initialState(context: ReturnType<typeof createConstructorContext>, ...args: unknown[]): {
      currentContractState: ContractState;
      currentPrivateState: unknown;
      currentZswapLocalState: unknown;
    };
  };
  witnesses: unknown;
  initialState: (
    context: ReturnType<typeof createConstructorContext>,
    ...args: unknown[]
  ) => {
    currentContractState: ContractState;
    currentPrivateState: unknown;
    currentZswapLocalState: unknown;
  };
};

type DeployProviders = {
  privateStateProvider: {
    setContractAddress(address: string): void;
    set(id: string, state: unknown): Promise<void>;
    setSigningKey?(contractAddress: string, signingKey: string): Promise<void>;
  };
  walletProvider: {
    getCoinPublicKey(): string;
    balanceTx(tx: unknown): Promise<unknown>;
  };
  midnightProvider: {
    submitTx(tx: unknown): Promise<void>;
  };
};

type DeployResult = {
  deployTxData: {
    public: {
      contractAddress: string;
      initialContractState: ContractState;
    };
    private: {
      signingKey: SigningKey;
      initialPrivateState: unknown;
      initialZswapState: unknown;
      unprovenTx: any;
      newCoins: never[];
    };
  };
  callTx: any;
  circuitMaintenanceTx: any;
  contractMaintenanceTx: any;
};

type DeployOptions = {
  compiledContract: BrowserContract;
  contractName: "accreditation" | "founder_majority";
  privateStateId?: string;
  initialPrivateState?: unknown;
  args?: unknown[];
};

type FindOptions = DeployOptions & {
  contractAddress: string;
};

function notReady(contractName: string, action: string) {
  return async () => {
    throw new Error(
      `${contractName} ${action} is not wired in the browser deploy shim yet.`,
    );
  };
}

function makeStubCallTx(contractName: string) {
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop !== "string") return undefined;
        return notReady(contractName, `circuit '${prop}'`);
      },
    },
  );
}

async function loadVerifierKey(contractName: "accreditation" | "founder_majority", circuitId: string) {
  const response = await fetch(`/contracts/${contractName}/keys/${circuitId}.verifier`);
  if (!response.ok) {
    throw new Error(
      `Failed to load verifier key for ${contractName}.${circuitId}: ${response.status} ${response.statusText}`,
    );
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function attachVerifierKeys(
  contractState: ContractState,
  contractName: "accreditation" | "founder_majority",
) {
  for (const circuitId of contractState.operations()) {
    const verifierKey = await loadVerifierKey(contractName, String(circuitId));
    const operation = contractState.operation(circuitId) ?? new ContractOperation();
    operation.verifierKey = verifierKey;
    contractState.setOperation(circuitId, operation);
  }
}

async function buildDeployTransaction(
  compiledContract: BrowserContract,
  contractName: "accreditation" | "founder_majority",
  initialPrivateState: unknown,
  args: unknown[],
  coinPublicKey: string,
): Promise<{
  contractAddress: string;
  initialContractState: ContractState;
  signingKey: SigningKey;
  unprovenTx: Transaction<any, any, any>;
  initialZswapState: unknown;
}> {
  const constructorContext = createConstructorContext(initialPrivateState, coinPublicKey);
  const contractCtor = compiledContract.constructor as new (witnesses: unknown) => {
    initialState(
      context: ReturnType<typeof createConstructorContext>,
      ...args: unknown[]
    ): {
      currentContractState: ContractState;
      currentPrivateState: unknown;
      currentZswapLocalState: unknown;
    };
  };
  const constructor = new contractCtor(compiledContract.witnesses);
  const result = constructor.initialState(constructorContext, ...args);
  const contractState = ContractState.deserialize(result.currentContractState.serialize());
  await attachVerifierKeys(contractState, contractName);
  const signingKey = sampleSigningKey();
  contractState.maintenanceAuthority = new ContractMaintenanceAuthority(
    [signatureVerifyingKey(signingKey)],
    1,
    0n,
  );
  contractState.balance = contractState.balance ?? new Map();

  const deploy = new ContractDeploy(contractState);
  const intent = Intent.new(ttlOneHour()).addDeploy(deploy);
  const unprovenTx = Transaction.fromParts(getNetworkId(), undefined, undefined, intent);

  return {
    contractAddress: deploy.address,
    initialContractState: deploy.initialState,
    signingKey,
    unprovenTx,
    initialZswapState: result.currentZswapLocalState,
  };
}

export async function deployContract(
  providers: DeployProviders,
  options: DeployOptions,
): Promise<DeployResult> {
  const { contractAddress, initialContractState, signingKey, unprovenTx, initialZswapState } =
    await buildDeployTransaction(
      options.compiledContract,
      options.contractName,
      options.initialPrivateState ?? {},
      options.args ?? [],
      providers.walletProvider.getCoinPublicKey(),
    );

  const balancedTx = await providers.walletProvider.balanceTx(unprovenTx);
  await providers.midnightProvider.submitTx(balancedTx);

  providers.privateStateProvider.setContractAddress(contractAddress);
  if (options.privateStateId) {
    await providers.privateStateProvider.set(options.privateStateId, options.initialPrivateState ?? {});
  }
  if (providers.privateStateProvider.setSigningKey) {
    await providers.privateStateProvider.setSigningKey(contractAddress, signingKey);
  }

  return {
    deployTxData: {
      public: {
        contractAddress,
        initialContractState,
      },
      private: {
        signingKey,
        initialPrivateState: options.initialPrivateState ?? {},
        initialZswapState,
        unprovenTx,
        newCoins: [],
      },
    },
    callTx: makeStubCallTx("deploy"),
    circuitMaintenanceTx: makeStubCallTx("deploy"),
    contractMaintenanceTx: makeStubCallTx("deploy"),
  };
}

export async function findDeployedContract(
  providers: DeployProviders,
  options: FindOptions,
): Promise<{
  callTx: any;
  circuitMaintenanceTx: any;
  contractMaintenanceTx: any;
}> {
  void providers;
  void options;

  return {
    callTx: makeStubCallTx("contract"),
    circuitMaintenanceTx: makeStubCallTx("contract"),
    contractMaintenanceTx: makeStubCallTx("contract"),
  };
}
