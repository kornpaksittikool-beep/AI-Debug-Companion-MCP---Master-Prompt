export type JsonSchemaPrimitive = string | number | boolean | null;

export type JsonSchemaValue =
  | JsonSchemaPrimitive
  | readonly JsonSchemaValue[]
  | { readonly [key: string]: JsonSchemaValue };

export type JsonSchemaObject = {
  readonly [key: string]: JsonSchemaValue;
};
