const COLOR_BLUE = "\x1b[34m";
const COLOR_GREEN = "\x1b[32m";
const COLOR_MAGENTA = "\x1b[35m";
const COLOR_WHITE = "\x1b[37m";
const COLOR_RESET = "\x1b[0m";

export const log = {
  info: (message: string) => console.log(`${COLOR_BLUE}${message}${COLOR_RESET}`),
  in: (message: string) => console.log(`${COLOR_WHITE}${message}${COLOR_RESET}`),
  out: (message: string) => console.log(`${COLOR_MAGENTA}${message}${COLOR_RESET}`),
};
