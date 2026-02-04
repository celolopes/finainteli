const readline = require("readline");
const { execSync, spawnSync } = require("child_process");

const run = (command, args = [], options = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) {
    console.error(`Falha ao executar: ${command} ${args.join(" ")}`);
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const resolveEasCommand = () => {
  const check = spawnSync("eas", ["--version"], { stdio: "ignore" });
  if (!check.error && check.status === 0) {
    return { cmd: "eas", prefix: [] };
  }
  if (process.env.npm_execpath) {
    console.log("EAS CLI não encontrada no PATH. Usando `npm exec --yes eas` via npm_execpath.");
    return { cmd: process.execPath, prefix: [process.env.npm_execpath, "exec", "--yes", "eas", "--"] };
  }
  const npmCheck = spawnSync("npm", ["--version"], { stdio: "ignore" });
  if (!npmCheck.error && npmCheck.status === 0) {
    console.log("EAS CLI não encontrada no PATH. Usando `npm exec --yes eas`.");
    return { cmd: "npm", prefix: ["exec", "--yes", "eas", "--"] };
  }
  throw new Error("EAS CLI não encontrada. Instale com `npm i -g eas-cli` ou rode o script via npm (npm_execpath).");
};

const getGitOutput = (command) => {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch (error) {
    return "";
  }
};

const createInterface = () =>
  readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

const ask = (rl, question) =>
  new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });

const ensureExpectedBranch = async (rl, expectedBranch) => {
  const current = getGitOutput("git rev-parse --abbrev-ref HEAD");
  if (!current) return;
  if (current === expectedBranch) return;

  const answer = await ask(
    rl,
    `Branch atual: ${current}. Esperado: ${expectedBranch}. Deseja trocar agora? (s/N): `,
  );
  if (answer.toLowerCase().startsWith("s")) {
    run("git", ["checkout", expectedBranch]);
  }
};

const hasNativeChanges = () => {
  const status = getGitOutput("git status --porcelain");
  if (!status) return [];
  const files = status
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
  return files.filter((file) => file.startsWith("ios/") || file.startsWith("android/"));
};

const maybeCommitChanges = async (rl) => {
  const status = getGitOutput("git status --short");
  if (!status) {
    console.log("Nenhuma alteração pendente para commit.");
    return;
  }

  const shouldCommit = await ask(rl, "Deseja fazer git add/commit antes do update? (s/N): ");
  if (!shouldCommit.toLowerCase().startsWith("s")) return;

  console.log("\nArquivos com alterações:\n" + status);

  const shouldAdd = await ask(rl, "Executar `git add -A` agora? (s/N): ");
  if (!shouldAdd.toLowerCase().startsWith("s")) return;

  run("git", ["add", "-A"]);

  console.log("\nExemplos de mensagens:");
  console.log("- chore(update): ajustes rápidos preview");
  console.log("- fix(premium): ajustar bypass preview");
  console.log("- docs: atualizar notas de release\n");

  const message = await ask(rl, "Informe a mensagem do commit (vazio para cancelar): ");
  if (!message) {
    console.log("Commit cancelado.");
    return;
  }

  run("git", ["commit", "-m", message]);
};

const main = async () => {
  const rl = createInterface();
  console.log("Selecione o canal de update:");
  console.log("1) Preview (beta/TestFlight)");
  console.log("2) Produção (master)\n");

  const choice = await ask(rl, "Escolha 1 ou 2: ");
  const channel = choice === "1" ? "preview" : "production";
  const expectedBranch = channel === "preview" ? "preview" : "master";

  await ensureExpectedBranch(rl, expectedBranch);

  const nativeChanges = hasNativeChanges();
  if (nativeChanges.length > 0) {
    console.log("\nDetectei alterações nativas, não é possível usar `eas update`:");
    nativeChanges.forEach((file) => console.log(`- ${file}`));
    console.log("\nFaça uma nova build (npm run create-build) para aplicar essas mudanças.");
    rl.close();
    process.exit(1);
  }

  await maybeCommitChanges(rl);

  const message = await ask(rl, "Mensagem do update (obrigatória): ");
  if (!message) {
    console.log("Mensagem obrigatória. Cancelando update.");
    rl.close();
    process.exit(1);
  }

  rl.close();

  if (channel === "preview") {
    process.env.EXPO_PUBLIC_ENV = "preview";
  } else {
    delete process.env.EXPO_PUBLIC_ENV;
  }

  console.log(`\nEnviando update (iOS + Android) para o canal "${channel}" (non-interactive)...`);
  let eas;
  try {
    eas = resolveEasCommand();
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
  run(eas.cmd, [...eas.prefix, "update", "--channel", channel, "--message", message, "--non-interactive"]);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
