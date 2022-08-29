const bcrypt = require("bcrypt");

async function pass() {
  saltRounds = 10;

  const password = "123456";

  try {
    encryptedPassword = await bcrypt.hash(password, saltRounds);
    console.log(encryptedPassword);
  } catch (err) {
    console.log("Error" + err);
  }
  console.log(
    await bcrypt.compare(
      password,
      "$2b$10$i88gKfMMysMwRihEiYSdC.5fzG5./iT3nqFcSgrJ4EXmhxsNwaZFa"
    )
  );
}
pass();
