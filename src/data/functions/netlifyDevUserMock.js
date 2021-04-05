import { setFakeUserRequest, getFakeUserRequest } from "../requests/index.js";
import { getUser } from "./userFunctions.js";
import { insertOne, getOne, updateOne } from "./mongoConnect";
export const fakeUser = {
  name: "Fake Local User",
  email: "tmhinkle@gmail.com",
}; /* This stuff seems kind of useless -- oops - probably delete this file */
console.log("Initialize mock fakeUser=>", fakeUser);

export function getFakeUser() {
  return fakeUser;
  /* let fake = getOne('users',{currentFake:true})
    if (!fake) {
        return createDefaultFakeUser();
    } else {
        return fake.user
    } */
}
getFakeUserRequest.setRequestHandler(getFakeUser);

export function setFakeUser(user, params) {
  console.log("setFakeUser", user, params);
  fakeUser.name = params.name;
  fakeUser.email = params.email;
  delete fakeUser.dbUser;
  console.log("Set fake user =>", fakeUser);
  return fakeUser;
}
setFakeUserRequest.setRequestHandler(setFakeUser);
