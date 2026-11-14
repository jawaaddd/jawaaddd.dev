/**
 * Prints the ADMIN_PASSWORD_HASH value for a password. The password is typed
 * without echoing and is never written anywhere.
 *
 *   npm run hash-password
 */
import { stdin, stdout } from "node:process";
import { hashPassword } from "../src/lib/auth";

const MIN_LENGTH = 12;

function ask(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) return reject(new Error("Run this in a terminal."));
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          return resolve(value);
        }
        if (char === "\u0003") process.exit(130); // Ctrl+C
        if (char === "\u007f")
          value = value.slice(0, -1); // Backspace
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}

const password = await ask("Admin password: ");
if (password.length < MIN_LENGTH) {
  console.error(`Use at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}
if ((await ask("Again: ")) !== password) {
  console.error("The passwords don't match.");
  process.exit(1);
}

console.log(`\nADMIN_PASSWORD_HASH=${hashPassword(password)}`);
