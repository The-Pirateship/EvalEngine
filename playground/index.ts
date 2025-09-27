import { evaluate } from "eval-engine";

console.log("🎮 Eval Engine Playground");
console.log("========================");

// Basic math expressions
console.log("\n📊 Math expressions:");
console.log("2 + 2 =", evaluate("2 + 2"));
console.log("10 * 5 =", evaluate("10 * 5"));
console.log("Math.sqrt(16) =", evaluate("Math.sqrt(16)"));

// String operations
console.log("\n📝 String operations:");
console.log('"Hello" + " World" =', evaluate('"Hello" + " World"'));

// Variables and functions
console.log("\n🔧 Complex expressions:");
console.log("Array operations:", evaluate("[1,2,3].map(x => x * 2)"));

// Error handling
console.log("\n❌ Error handling:");
try {
  console.log("Invalid syntax:", evaluate("2 +"));
} catch (error) {
  console.log("Caught error:", error);
}
