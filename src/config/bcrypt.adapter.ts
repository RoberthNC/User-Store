import { compareSync, genSaltSync, hashSync } from "bcryptjs";

export const bcryptAdapter = {
  hash: (password: string) => {
    const salt = genSaltSync(10);
    return hashSync(password, salt);
  },
  compare: (password: string, passwordHashed: string) => {
    return compareSync(password, passwordHashed);
  },
};
