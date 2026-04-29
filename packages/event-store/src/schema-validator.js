const rfc3339DateTime =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export function validateJsonSchema(value, schema) {
  const errors = [];
  validateNode(value, schema, "$", schema, errors);
  return errors;
}

function validateNode(value, schema, path, rootSchema, errors) {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, rootSchema);
    validateNode(value, resolved, path, rootSchema, errors);
    return;
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(", ")}`);
  }

  if (schema.type && !matchesType(value, schema.type)) {
    errors.push(`${path} must be ${schema.type}`);
    return;
  }

  if (schema.type === "string") {
    validateString(value, schema, path, errors);
  }

  if (schema.type === "integer") {
    validateNumber(value, schema, path, errors);
  }

  if (schema.type === "object") {
    validateObject(value, schema, path, rootSchema, errors);
  }

  if (schema.type === "array") {
    validateArray(value, schema, path, rootSchema, errors);
  }
}

function validateString(value, schema, path, errors) {
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push(`${path} length must be at least ${schema.minLength}`);
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push(`${path} length must be at most ${schema.maxLength}`);
  }

  if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${path} must match ${schema.pattern}`);
  }

  if (schema.format === "date-time" && !rfc3339DateTime.test(value)) {
    errors.push(`${path} must be an RFC 3339 UTC timestamp`);
  }
}

function validateNumber(value, schema, path, errors) {
  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${path} must be >= ${schema.minimum}`);
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push(`${path} must be <= ${schema.maximum}`);
  }
}

function validateObject(value, schema, path, rootSchema, errors) {
  const required = schema.required ?? [];
  for (const key of required) {
    if (!Object.hasOwn(value, key)) {
      errors.push(`${path}.${key} is required`);
    }
  }

  const properties = schema.properties ?? {};
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(properties, key)) {
        errors.push(`${path}.${key} is not allowed`);
      }
    }
  }

  if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) {
    errors.push(`${path} must have at least ${schema.minProperties} properties`);
  }

  for (const [key, propertySchema] of Object.entries(properties)) {
    if (Object.hasOwn(value, key)) {
      validateNode(value[key], propertySchema, `${path}.${key}`, rootSchema, errors);
    }
  }
}

function validateArray(value, schema, path, rootSchema, errors) {
  for (const [index, item] of value.entries()) {
    validateNode(item, schema.items ?? {}, `${path}[${index}]`, rootSchema, errors);
  }
}

function matchesType(value, type) {
  if (type === "array") {
    return Array.isArray(value);
  }

  if (type === "integer") {
    return Number.isInteger(value);
  }

  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  return typeof value === type;
}

function resolveRef(ref, rootSchema) {
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported schema ref: ${ref}`);
  }

  return ref
    .slice(2)
    .split("/")
    .reduce((node, key) => node[key], rootSchema);
}
