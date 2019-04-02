import type from "@tleef/type-js";

interface IBody {[key: string]: any; }

const json = (body: string | IBody) => {
  if (type.isString(body)) {
    return JSON.parse(body as string);
  }

  return body;
};

export default {
  json,
};

export {
  json,
};
