
import hre from "hardhat";
import { namehash, hexToBytes, bytesToHex, keccak256 } from "viem";

async function main() {
  const { viem, artifacts } = hre;
  const { deployer, owner } = await viem.getNamedClients();

  // Deployments
  const registry         = await viem.getContract("ENSRegistry", owner);
  const reverseRegistrar = await viem.getContract("ReverseRegistrar", owner);
  const publicResolver   = await viem.getContract("PublicResolver", owner);

  // Static nodes
  const ADDR_REVERSE_NODE = namehash("addr.reverse");

  console.log("\n📝 Checking Reverse Resolution Setup\n");

  // 1) Default resolver
  const defaultResolver = await reverseRegistrar.read.defaultResolver();
  console.log("1) reverseRegistrar.defaultResolver:", defaultResolver);

  // 2) Owner of addr.reverse
  const ownerOfReverseNode = await registry.read.owner([ADDR_REVERSE_NODE]);
  console.log("2) ENS.owner(addr.reverse):", ownerOfReverseNode);

  // 3) Reverse lookup
  const yourReverseNode = await reverseRegistrar.read.node([owner.address]);
  console.log("3) reverseRegistrar.node(deployer):", yourReverseNode);

  // 4) Now *read* the name from the resolver, not the registrar:
  const reverseName = await publicResolver.read.name([yourReverseNode]);
  console.log("4) publicResolver.name(reverseNode):", reverseName || "<none>");


  // 4) Resolver interface for name(bytes32)
  // EIP-181 interface ID for reverse name is first 4 bytes of keccak256("name(bytes32)")
  const ifaceId = bytesToHex(hexToBytes(keccak256(new TextEncoder().encode("name(bytes32)"))).slice(0, 4));
  console.log("4) name(bytes32) interface ID:", ifaceId);

  const resolverSupports = await publicResolver.read.supportsInterface([ifaceId]);
  console.log("5) publicResolver.supportsInterface(nameIface):", resolverSupports);

  console.log("\n✅ Reverse resolution check complete\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
