/**
 * Document Analyzer for rbxjson files
 *
 * Uses jsonc-parser (same as VS Code's JSON language service) for reliable
 * AST-based context detection. Works correctly when editing existing values,
 * not just when typing new ones.
 */

import { Position, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parseTree, findNodeAtOffset, Node, getNodePath, getNodeValue } from 'jsonc-parser';

export type ContextType =
  | 'root'           // At root level of document
  | 'rootKey'        // Typing a root-level key (className, name, properties, etc.)
  | 'className'      // Inside className value
  | 'propertyKey'    // Typing a property name in properties object
  | 'propertyValue'  // Inside a property value
  | 'propertyValueKey' // Typing a field key inside property value (type, value, originalType)
  | 'enumValueKey'   // Typing a field key inside enum value object (enumType, value)
  | 'structFieldKey' // Typing a field key inside struct value (x/y/z, r/g/b, scale/offset)
  | 'typeField'      // Inside "type" field of a property
  | 'originalTypeField' // Inside "originalType" field of a property
  | 'valueField'     // Inside "value" field of a property
  | 'wrongValueStructure' // Inside an object/array but type expects a primitive (needs fix)
  | 'enumType'       // Inside enumType field
  | 'enumValue'      // Inside enum value field
  | 'vectorField'    // Inside vector x/y/z fields (numeric value)
  | 'attributeKey'   // Typing an attribute name
  | 'attributeValue' // Inside an attribute value
  | 'tag'            // Inside tags array
  | 'unknown';

export interface DocumentContext {
  type: ContextType;
  className: string | null;
  propertyName: string | null;
  propertyType: string | null;
  enumType: string | null;
  path: string[];       // JSON path to current location
  prefix: string;       // Text typed so far (for filtering completions)
  range: Range;         // Range to replace with completion
  insideQuote: boolean; // Whether cursor is inside a string
  valueRange?: Range;   // Range of the entire value (for fix completions)
}

export interface ParsedDocument {
  className: string | null;
  name: string | null;
  properties: Record<string, unknown>;
  attributes: Record<string, unknown>;
  tags: string[];
  parseErrors: Array<{ message: string; offset: number }>;
}

// Struct types that have specific field completions (value is an object)
const STRUCT_TYPES = [
  'Vector3', 'Vector2', 'Vector2int16', 'Vector3int16',
  'Color3', 'Color3uint8', 'UDim', 'UDim2', 'CFrame',
  'NumberRange', 'Rect', 'Ray', 'PhysicalProperties', 'Font',
  'Faces', 'Axes', 'Region3', 'Region3int16', 'NumberSequence',
  'ColorSequence', 'SharedString', 'Enum'
];

// Primitive types where value should NOT be an object
const PRIMITIVE_TYPES = [
  'bool', 'int', 'int64', 'float', 'double', 'string',
  'Content', 'ProtectedString', 'BinaryString', 'BrickColor',
  'SecurityCapabilities', 'UniqueId', 'Ref'
];

/**
 * Parse an rbxjson document
 */
export function parseDocument(document: TextDocument): ParsedDocument {
  const text = document.getText();
  const errors: Array<{ message: string; offset: number }> = [];

  const root = parseTree(text, errors.map(e => ({ error: 0, offset: e.offset, length: 1 })), {
    allowTrailingComma: true,
    disallowComments: false,
  });

  // Extract values from AST
  let className: string | null = null;
  let name: string | null = null;
  let properties: Record<string, unknown> = {};
  let attributes: Record<string, unknown> = {};
  let tags: string[] = [];

  if (root && root.type === 'object' && root.children) {
    for (const prop of root.children) {
      if (prop.type === 'property' && prop.children && prop.children.length === 2) {
        const keyNode = prop.children[0];
        const valueNode = prop.children[1];
        const key = getNodeValue(keyNode);

        if (key === 'className' && valueNode.type === 'string') {
          className = getNodeValue(valueNode);
        } else if (key === 'name' && valueNode.type === 'string') {
          name = getNodeValue(valueNode);
        } else if (key === 'properties' && valueNode.type === 'object') {
          properties = getNodeValue(valueNode) || {};
        } else if (key === 'attributes' && valueNode.type === 'object') {
          attributes = getNodeValue(valueNode) || {};
        } else if (key === 'tags' && valueNode.type === 'array') {
          tags = getNodeValue(valueNode) || [];
        }
      }
    }
  }

  // Fallback: extract className via regex if AST parsing failed
  if (!className) {
    const classNameMatch = text.match(/"className"\s*:\s*"([^"]*)"/);
    if (classNameMatch) {
      className = classNameMatch[1];
    }
  }

  return {
    className,
    name,
    properties,
    attributes,
    tags,
    parseErrors: errors,
  };
}

/**
 * Analyze context at a position for completions using AST
 */
export function analyzeContext(document: TextDocument, position: Position): DocumentContext {
  const text = document.getText();
  const offset = document.offsetAt(position);

  // Parse into AST (tolerates incomplete JSON)
  const parseErrors: any[] = [];
  const root = parseTree(text, parseErrors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  // Default context
  const defaultContext: DocumentContext = {
    type: 'unknown',
    className: null,
    propertyName: null,
    propertyType: null,
    enumType: null,
    path: [],
    prefix: '',
    range: { start: position, end: position },
    insideQuote: false,
  };

  // Extract className from document
  const parsed = parseDocument(document);
  defaultContext.className = parsed.className;

  if (!root) {
    console.log('[DocumentAnalyzer] No AST root - document may be empty or invalid, defaulting to rootKey');
    // Empty or invalid document - return rootKey so templates are offered
    defaultContext.type = 'rootKey';
    return defaultContext;
  }

  // Find node at cursor position
  // includeRightBound=true ensures we catch cursor inside strings
  const node = findNodeAtOffset(root, offset, true);

  if (!node) {
    console.log('[DocumentAnalyzer] No node at offset', offset, '- defaulting to rootKey');
    // No node found - likely empty area, return rootKey for template suggestions
    defaultContext.type = 'rootKey';
    return defaultContext;
  }

  // Get the JSON path to this node
  const path = getNodePath(node);
  console.log(`[DocumentAnalyzer] AST path: ${JSON.stringify(path)}, node type: ${node.type}`);

  // Calculate prefix (what user has typed so far)
  const prefix = calculatePrefix(text, offset, node);
  const range = calculateRange(document, position, node, offset);
  const insideQuote = node.type === 'string';

  // Build context from AST path
  const context: DocumentContext = {
    type: 'unknown',
    className: parsed.className,
    propertyName: null,
    propertyType: null,
    enumType: null,
    path: path.map(p => String(p)),
    prefix,
    range,
    insideQuote,
  };

  // Special case: detect when cursor is right after a colon with no value yet
  // AST won't have a value node, so we need text-based detection
  const textBeforeCursor = text.substring(Math.max(0, offset - 100), offset);

  // Check for "enumType": position (cursor after colon, no value)
  const enumTypeColonMatch = textBeforeCursor.match(/"enumType"\s*:\s*$/);
  if (enumTypeColonMatch) {
    // We're right after "enumType": - need to provide enum type completions
    // Find the property name from the text
    const propNameMatch = textBeforeCursor.match(/"([A-Za-z][A-Za-z0-9_]*)"\s*:\s*\{[^}]*"enumType"\s*:\s*$/);
    if (propNameMatch) {
      context.propertyName = propNameMatch[1];
    } else if (path.length >= 2 && path[0] === 'properties') {
      context.propertyName = String(path[1]);
    }
    context.prefix = '';
    context.type = 'enumType';
    console.log(`[DocumentAnalyzer] Detected "enumType": position, propertyName=${context.propertyName}`);
    return context;
  }

  const valueColonMatch = textBeforeCursor.match(/"value"\s*:\s*$/);
  if (valueColonMatch) {
    // We're right after "value": - need to provide value completions
    // Find the property name from the path or text
    const propNameMatch = textBeforeCursor.match(/"([A-Za-z][A-Za-z0-9_]*)"\s*:\s*\{[^}]*"value"\s*:\s*$/);
    if (propNameMatch) {
      context.propertyName = propNameMatch[1];
    } else if (path.length >= 2 && path[0] === 'properties') {
      context.propertyName = String(path[1]);
    }

    // Get the property type
    if (context.propertyName) {
      context.propertyType = getPropertyTypeFromAST(root, context.propertyName);
    }

    console.log(`[DocumentAnalyzer] Detected "value": position, propertyName=${context.propertyName}, propertyType=${context.propertyType}`);
    context.type = 'valueField';
    return context;
  }

  // Determine context type based on path
  determineContextType(context, path, node, root, text, document, offset);

  console.log(`[DocumentAnalyzer] Context: type=${context.type}, propertyName=${context.propertyName}, propertyType=${context.propertyType}, prefix="${context.prefix}"`);

  return context;
}

/**
 * Determine context type from AST path
 */
function determineContextType(
  context: DocumentContext,
  path: (string | number)[],
  node: Node,
  root: Node,
  text: string,
  document: TextDocument,
  offset: number
): void {
  const pathStr = path.map(p => String(p));

  // Path examples:
  // ["className"] - inside className value
  // ["properties", "Anchored", "type"] - inside type field for Anchored property
  // ["properties", "Anchored", "value"] - inside value field
  // ["properties", "Size", "value", "x"] - inside x field of Vector3 value
  // ["properties"] - at properties level
  // ["tags", 0] - inside tags array

  // Check if we're inside className
  if (pathStr.length === 1 && pathStr[0] === 'className') {
    context.type = 'className';
    return;
  }

  // Check if we're inside properties
  if (pathStr[0] === 'properties') {
    if (pathStr.length === 1) {
      // At properties level - typing a property key
      context.type = 'propertyKey';
      return;
    }

    // Inside a specific property
    const propertyName = pathStr[1];

    // Empty property name means user is typing a NEW property key
    // AST creates path ["properties", ""] when cursor is at "properties": { "|" }
    if (propertyName === '') {
      context.type = 'propertyKey';
      context.propertyName = null;
      return;
    }

    context.propertyName = propertyName;

    if (pathStr.length === 2) {
      // Could be:
      // 1. Typing a NEW property key like "Siz" (no colon/value yet) -> propertyKey
      // 2. Inside an existing property's value object typing "type"/"value" -> propertyValueKey

      // Check if this is actually a property key being typed (no colon after)
      // Look at text after cursor to see if there's a colon indicating this property has a value
      const textAfterCursor = text.substring(offset, Math.min(offset + 20, text.length));
      const hasColonAfter = /^\s*["']?\s*:/.test(textAfterCursor) || /^[^"'\n]*["']?\s*:/.test(textAfterCursor);

      // Also check if this property exists in the parsed document with a value
      const parsedProps = context.className ? (parseDocument(document).properties || {}) : {};
      const propertyHasValue = propertyName in parsedProps &&
                               parsedProps[propertyName] !== null &&
                               typeof parsedProps[propertyName] === 'object';

      if (!hasColonAfter && !propertyHasValue) {
        // User is typing a NEW property key
        context.type = 'propertyKey';
        context.propertyName = null; // Not yet a valid property
        return;
      }

      // At property object level - typing a key like "type" or "value"
      context.type = 'propertyValueKey';
      return;
    }

    // Inside a property field
    const fieldName = pathStr[2];

    if (fieldName === 'type') {
      context.type = 'typeField';
      return;
    }

    if (fieldName === 'originalType') {
      context.type = 'originalTypeField';
      return;
    }

    if (fieldName === 'value') {
      // Get the type for this property from the AST
      const propertyType = getPropertyTypeFromAST(root, propertyName);
      context.propertyType = propertyType;

      console.log(`[DocumentAnalyzer] In value field: propertyName=${propertyName}, propertyType=${propertyType}, pathLen=${pathStr.length}, isPrimitive=${propertyType ? PRIMITIVE_TYPES.includes(propertyType) : false}`);

      // Check if type expects a primitive but we're inside an object/nested structure
      // This happens when user has "value": { ... } but should have "value": 0
      if (propertyType && PRIMITIVE_TYPES.includes(propertyType)) {
        // For primitive types, find and store the value range for fix completions
        const valueNodeRange = getValueNodeRange(root, propertyName, document);
        if (valueNodeRange) {
          context.valueRange = valueNodeRange;
        }

        if (pathStr.length > 3) {
          // Inside an object/array but type expects primitive - wrong structure!
          context.type = 'wrongValueStructure';
          console.log(`[DocumentAnalyzer] Wrong structure detected: ${propertyType} expects primitive, but cursor is inside nested object`);
          return;
        }
        // At value level, normal primitive completion
        context.type = 'valueField';
        return;
      }

      if (pathStr.length === 3) {
        // Directly inside "value" field
        if (propertyType === 'Enum') {
          // Enum value is an object with enumType and value
          context.type = 'enumValueKey';
        } else if (propertyType && STRUCT_TYPES.includes(propertyType)) {
          // Struct value - typing field keys
          context.type = 'structFieldKey';
        } else {
          // Unknown type - provide generic value field
          context.type = 'valueField';
        }
        return;
      }

      // Inside nested value object (depth 4+)
      const nestedField = pathStr[3];

      if (propertyType === 'Enum') {
        if (nestedField === 'enumType') {
          context.type = 'enumType';
          return;
        }
        if (nestedField === 'value') {
          context.type = 'enumValue';
          // Try to get enumType from AST
          context.enumType = getEnumTypeFromAST(root, propertyName);
          return;
        }
        // Typing a key inside enum value object
        context.type = 'enumValueKey';
        return;
      }

      if (propertyType && STRUCT_TYPES.includes(propertyType)) {
        // Inside a struct field
        if (pathStr.length === 4) {
          // At field value level (e.g., x, y, z for Vector3)
          context.type = 'vectorField';
        } else {
          // Deeper nesting (e.g., UDim2.x.scale)
          context.type = 'structFieldKey';
        }
        return;
      }

      // Fallback: detect enum context from field names even if propertyType is unknown
      // This handles cases where AST parsing of "type" field fails during editing
      if (nestedField === 'enumType') {
        context.type = 'enumType';
        return;
      }
      if (nestedField === 'value' && pathStr.length === 4) {
        // Could be enum value - check if there's an enumType sibling in the AST
        const enumType = getEnumTypeFromAST(root, propertyName);
        if (enumType) {
          context.type = 'enumValue';
          context.enumType = enumType;
          return;
        }
      }

      context.type = 'valueField';
      return;
    }

    // Other field in property object
    context.type = 'propertyValueKey';
    return;
  }

  // Check if we're inside attributes
  if (pathStr[0] === 'attributes') {
    if (pathStr.length === 1) {
      context.type = 'attributeKey';
    } else {
      context.type = 'attributeValue';
    }
    return;
  }

  // Check if we're inside tags
  if (pathStr[0] === 'tags') {
    context.type = 'tag';
    return;
  }

  // At root level
  if (pathStr.length === 0 || (pathStr.length === 1 && typeof path[0] === 'string')) {
    context.type = 'rootKey';
    return;
  }
}

/**
 * Get the "type" value for a property from the AST
 */
function getPropertyTypeFromAST(root: Node, propertyName: string): string | null {
  if (!root || root.type !== 'object' || !root.children) return null;

  // Find properties node
  for (const child of root.children) {
    if (child.type === 'property' && child.children && child.children.length === 2) {
      const keyNode = child.children[0];
      if (getNodeValue(keyNode) === 'properties') {
        const propsNode = child.children[1];
        if (propsNode.type === 'object' && propsNode.children) {
          // Find the specific property
          for (const propChild of propsNode.children) {
            if (propChild.type === 'property' && propChild.children && propChild.children.length === 2) {
              const propKeyNode = propChild.children[0];
              if (getNodeValue(propKeyNode) === propertyName) {
                const propValueNode = propChild.children[1];
                if (propValueNode.type === 'object' && propValueNode.children) {
                  // Find "type" field
                  for (const field of propValueNode.children) {
                    if (field.type === 'property' && field.children && field.children.length === 2) {
                      const fieldKeyNode = field.children[0];
                      if (getNodeValue(fieldKeyNode) === 'type') {
                        return getNodeValue(field.children[1]);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Get the "enumType" value for a property from the AST
 */
function getEnumTypeFromAST(root: Node, propertyName: string): string | null {
  if (!root || root.type !== 'object' || !root.children) return null;

  // Find properties node
  for (const child of root.children) {
    if (child.type === 'property' && child.children && child.children.length === 2) {
      const keyNode = child.children[0];
      if (getNodeValue(keyNode) === 'properties') {
        const propsNode = child.children[1];
        if (propsNode.type === 'object' && propsNode.children) {
          // Find the specific property
          for (const propChild of propsNode.children) {
            if (propChild.type === 'property' && propChild.children && propChild.children.length === 2) {
              const propKeyNode = propChild.children[0];
              if (getNodeValue(propKeyNode) === propertyName) {
                const propValueNode = propChild.children[1];
                if (propValueNode.type === 'object' && propValueNode.children) {
                  // Find "value" field
                  for (const field of propValueNode.children) {
                    if (field.type === 'property' && field.children && field.children.length === 2) {
                      const fieldKeyNode = field.children[0];
                      if (getNodeValue(fieldKeyNode) === 'value') {
                        const valueNode = field.children[1];
                        if (valueNode.type === 'object' && valueNode.children) {
                          // Find "enumType" in value object
                          for (const enumField of valueNode.children) {
                            if (enumField.type === 'property' && enumField.children && enumField.children.length === 2) {
                              const enumKeyNode = enumField.children[0];
                              if (getNodeValue(enumKeyNode) === 'enumType') {
                                return getNodeValue(enumField.children[1]);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Get the range of the "value" field for a property (for fix completions)
 */
function getValueNodeRange(root: Node, propertyName: string, document: TextDocument): Range | null {
  if (!root || root.type !== 'object' || !root.children) return null;

  // Find properties node
  for (const child of root.children) {
    if (child.type === 'property' && child.children && child.children.length === 2) {
      const keyNode = child.children[0];
      if (getNodeValue(keyNode) === 'properties') {
        const propsNode = child.children[1];
        if (propsNode.type === 'object' && propsNode.children) {
          // Find the specific property
          for (const propChild of propsNode.children) {
            if (propChild.type === 'property' && propChild.children && propChild.children.length === 2) {
              const propKeyNode = propChild.children[0];
              if (getNodeValue(propKeyNode) === propertyName) {
                const propValueNode = propChild.children[1];
                if (propValueNode.type === 'object' && propValueNode.children) {
                  // Find "value" field
                  for (const field of propValueNode.children) {
                    if (field.type === 'property' && field.children && field.children.length === 2) {
                      const fieldKeyNode = field.children[0];
                      if (getNodeValue(fieldKeyNode) === 'value') {
                        const valueNode = field.children[1];
                        // Return the range of the value node
                        return {
                          start: document.positionAt(valueNode.offset),
                          end: document.positionAt(valueNode.offset + valueNode.length),
                        };
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Calculate the prefix (text typed so far) from the cursor position
 */
function calculatePrefix(text: string, offset: number, node: Node): string {
  if (node.type === 'string') {
    // Inside a string - get text from string start to cursor
    const stringStart = node.offset + 1; // +1 to skip opening quote
    if (offset > stringStart) {
      return text.substring(stringStart, offset);
    }
    return '';
  }

  // For other node types, look backwards for word characters
  let start = offset;
  while (start > 0) {
    const char = text[start - 1];
    if (!/[a-zA-Z0-9_]/.test(char)) {
      break;
    }
    start--;
  }

  return text.substring(start, offset);
}

/**
 * Calculate the range to replace with completion
 */
function calculateRange(document: TextDocument, position: Position, node: Node, offset: number): Range {
  if (node.type === 'string') {
    // Replace the entire string content (between quotes)
    const stringStart = node.offset + 1; // After opening quote
    const stringEnd = node.offset + node.length - 1; // Before closing quote

    return {
      start: document.positionAt(stringStart),
      end: document.positionAt(Math.max(stringStart, stringEnd)),
    };
  }

  // For property keys being typed, replace from the current position
  const prefix = calculatePrefix(document.getText(), offset, node);
  return {
    start: document.positionAt(offset - prefix.length),
    end: position,
  };
}

/**
 * Find all property names and their ranges in a document
 */
export function findPropertyRanges(document: TextDocument): Map<string, Range> {
  const text = document.getText();
  const ranges = new Map<string, Range>();

  const root = parseTree(text, [], { allowTrailingComma: true });
  if (!root || root.type !== 'object' || !root.children) return ranges;

  // Find properties node
  for (const child of root.children) {
    if (child.type === 'property' && child.children && child.children.length === 2) {
      const keyNode = child.children[0];
      if (getNodeValue(keyNode) === 'properties') {
        const propsNode = child.children[1];
        if (propsNode.type === 'object' && propsNode.children) {
          for (const propChild of propsNode.children) {
            if (propChild.type === 'property' && propChild.children && propChild.children.length === 2) {
              const propKeyNode = propChild.children[0];
              const propName = getNodeValue(propKeyNode);
              if (propName && propKeyNode.offset !== undefined) {
                ranges.set(propName, {
                  start: document.positionAt(propKeyNode.offset + 1), // After opening quote
                  end: document.positionAt(propKeyNode.offset + propKeyNode.length - 1), // Before closing quote
                });
              }
            }
          }
        }
      }
    }
  }

  return ranges;
}

/**
 * Get the range of the className value
 */
export function findClassNameRange(document: TextDocument): Range | null {
  const text = document.getText();

  const root = parseTree(text, [], { allowTrailingComma: true });
  if (!root || root.type !== 'object' || !root.children) return null;

  for (const child of root.children) {
    if (child.type === 'property' && child.children && child.children.length === 2) {
      const keyNode = child.children[0];
      if (getNodeValue(keyNode) === 'className') {
        const valueNode = child.children[1];
        if (valueNode.type === 'string' && valueNode.offset !== undefined) {
          return {
            start: document.positionAt(valueNode.offset + 1), // After opening quote
            end: document.positionAt(valueNode.offset + valueNode.length - 1), // Before closing quote
          };
        }
      }
    }
  }

  return null;
}
