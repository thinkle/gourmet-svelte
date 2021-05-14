import { jsonConcisify } from "./textUtils";
export const DEFINED = 1;
export const TRUTHY = 2;

export function require(required, params, mode = DEFINED) {
  if (typeof required == "string") {
    required = [required];
  }
  if (!params) {
    throw new Error(
      `Parameters undefined, but we require ${required.join(", ")}`
    );
  }
  for (let param of required) {
    let parts = param.split(".");
    let o = params;
    let currentParamName = "";
    for (let p of parts) {
      currentParamName = (currentParamName && currentParamName + "." + p) || p;
      if (o[p] === undefined) {
        throw new Error(
          `Missing required parameter ${currentParamName}.\n\n Was called with ${jsonConcisify(
            params
          )}`
        );
      } else {
        o = o[p];
      }
    }
    if (mode === TRUTHY) {
      if (!o) {
        throw new Error(
          `Received falsy value for required truthy parameter ${currentParamName}. \n\nWas called with ${jsonConcisify(
            params
          )}`
        );
      }
    }
  }
}
