/**
 * Completion Provider for rbxjson files
 *
 * Provides context-aware completions for class names, properties, types, and enum values.
 */

import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  MarkupKind,
  TextEdit,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position } from 'vscode-languageserver-types';
import { APIDumpHandler } from './apiDump';
import { DocumentContext, analyzeContext } from './documentAnalyzer';
import { PROPERTY_TYPES, PropertyType } from './apiDumpTypes';

export class CompletionProvider {
  constructor(private apiDump: APIDumpHandler) {}

  /**
   * Get completions for a position in a document
   */
  getCompletions(document: TextDocument, position: Position): CompletionItem[] {
    const context = analyzeContext(document, position);

    // Debug logging - verbose
    console.log(`[CompletionProvider] ===== COMPLETION REQUEST =====`);
    console.log(`[CompletionProvider] Position: line=${position.line}, char=${position.character}`);
    console.log(`[CompletionProvider] Context: type=${context.type}, className=${context.className}`);
    console.log(`[CompletionProvider] Prefix: "${context.prefix}", propertyName=${context.propertyName}`);
    console.log(`[CompletionProvider] PropertyType: ${context.propertyType}, enumType: ${context.enumType}`);

    switch (context.type) {
      case 'rootKey':
        return this.getRootKeyCompletions(context);

      case 'className':
        return this.getClassNameCompletions(context);

      case 'propertyKey':
        return this.getPropertyKeyCompletions(context);

      case 'propertyValueKey':
        return this.getPropertyValueKeyCompletions(context);

      case 'enumValueKey':
        return this.getEnumValueKeyCompletions(context);

      case 'structFieldKey':
        return this.getStructFieldKeyCompletions(context);

      case 'typeField':
        return this.getTypeCompletions(context);

      case 'originalTypeField':
        return this.getOriginalTypeCompletions(context);

      case 'enumType':
        return this.getEnumTypeCompletions(context);

      case 'enumValue':
        return this.getEnumValueCompletions(context);

      case 'valueField':
        return this.getValueFieldCompletions(context);

      case 'wrongValueStructure':
        return this.getWrongValueStructureCompletions(context);

      case 'vectorField':
        return []; // No completions for numeric fields

      case 'attributeKey':
        return this.getAttributeKeyCompletions(context);

      case 'attributeValue':
        return this.getAttributeValueCompletions(context);

      case 'tag':
        return this.getTagCompletions(context);

      default:
        return [];
    }
  }

  /**
   * Completions for root-level keys
   */
  private getRootKeyCompletions(context: DocumentContext): CompletionItem[] {
    const completions: CompletionItem[] = [];
    const prefix = context.prefix.toLowerCase();

    console.log(`[getRootKeyCompletions] prefix="${prefix}", range=${JSON.stringify(context.range)}`);

    // Standard keys - always show when prefix is empty or matches
    const keys = [
      { key: 'className', detail: 'Roblox class name', snippet: '"className": "${1:Part}"', required: true },
      { key: 'name', detail: 'Instance name', snippet: '"name": "${1}"', required: true },
      { key: 'referenceId', detail: 'Unique identifier (UUID)', snippet: '"referenceId": "${1}"', required: false },
      { key: 'path', detail: 'Instance path in tree', snippet: '"path": "${1}"', required: false },
      { key: 'properties', detail: 'Instance properties', snippet: '"properties": {\n\t$0\n}', required: false },
      { key: 'attributes', detail: 'Custom attributes', snippet: '"attributes": {\n\t$0\n}', required: false },
      { key: 'tags', detail: 'CollectionService tags', snippet: '"tags": [$0]', required: false },
    ];

    for (const k of keys) {
      // Show if prefix is empty OR key starts with prefix
      if (prefix === '' || k.key.toLowerCase().startsWith(prefix)) {
        completions.push({
          label: k.key,
          kind: CompletionItemKind.Property,
          detail: k.detail,
          insertText: k.snippet,
          insertTextFormat: InsertTextFormat.Snippet,
          filterText: k.key.toLowerCase(),
          sortText: k.required ? '0' + k.key : '1' + k.key,
        });
      }
    }

    // Add class template snippets at root level
    const commonClasses = ['Part', 'Script', 'LocalScript', 'ModuleScript', 'Folder', 'Model', 'Frame', 'TextLabel', 'TextButton', 'Sound', 'ScreenGui'];
    for (const className of commonClasses) {
      // Show if prefix is empty OR class name starts with prefix
      if (prefix === '' || className.toLowerCase().startsWith(prefix) || 'template'.startsWith(prefix)) {
        const template = this.generateFullTemplate(className);
        completions.push({
          label: `${className} template`,
          kind: CompletionItemKind.Snippet,
          detail: `Full rbxjson for ${className}`,
          documentation: {
            kind: MarkupKind.Markdown,
            value: `Creates a complete **${className}** rbxjson with common properties.`,
          },
          insertText: template,
          insertTextFormat: InsertTextFormat.Snippet,
          filterText: className.toLowerCase() + ' template',
          sortText: '00' + className,
        });
      }
    }

    console.log(`[getRootKeyCompletions] returning ${completions.length} completions`);
    return completions;
  }

  /**
   * Generate a complete rbxjson template for a class
   */
  private generateFullTemplate(className: string): string {
    const props = this.apiDump.getSerializableProperties(className);
    const commonProps = this.getCommonPropertiesForClass(className, props);

    let template = `{\n\t"className": "${className}",\n\t"name": "\${1:${className}}",\n\t"properties": {\n`;

    const propLines: string[] = [];
    let tabStop = 2;

    // Limit to most important properties for the template
    const limitedProps = commonProps.slice(0, 8);

    for (const prop of limitedProps) {
      const expectedType = this.apiDump.getExpectedType(className, prop.name);
      const propTemplate = this.getPropertyValueTemplate(prop.name, expectedType, tabStop);
      propLines.push(`\t\t${propTemplate}`);
      tabStop += this.countTabStops(propTemplate);
    }

    template += propLines.join(',\n');
    template += '\n\t}\n}';

    return template;
  }

  /**
   * Completions for className values
   */
  private getClassNameCompletions(context: DocumentContext): CompletionItem[] {
    const classNames = this.apiDump.getAllClassNames();

    const filtered = classNames
      .filter(name => name.toLowerCase().startsWith(context.prefix.toLowerCase()));

    return filtered.map((name, index) => {
      const classInfo = this.apiDump.getClassInfo(name);
      const superclass = classInfo?.Superclass;

      return {
        label: name,
        kind: CompletionItemKind.Class,
        detail: superclass ? `extends ${superclass}` : undefined,
        documentation: {
          kind: MarkupKind.Markdown,
          value: this.getClassDocumentation(name),
        },
        // Use textEdit to replace user's text with correctly-cased value
        textEdit: TextEdit.replace(context.range, name),
        filterText: name.toLowerCase(), // Case-insensitive filtering
        sortText: this.getClassSortText(name),
        preselect: index === 0,
      };
    });
  }

  /**
   * Get all serializable properties for a class, with priority ones first
   */
  private getCommonPropertiesForClass(className: string, props: Array<{ name: string; definedIn: string; valueType: { Name: string } }>): Array<{ name: string; definedIn: string; valueType: { Name: string } }> {
    // Priority properties by class type (these go first)
    const priorityByClass: Record<string, string[]> = {
      'Part': ['Anchored', 'CanCollide', 'Size', 'CFrame', 'Color', 'Material', 'Transparency', 'Shape'],
      'MeshPart': ['Anchored', 'CanCollide', 'Size', 'CFrame', 'Color', 'Material', 'Transparency', 'MeshId', 'TextureID'],
      'Script': ['Disabled'],
      'LocalScript': ['Disabled'],
      'ModuleScript': [],
      'Frame': ['Size', 'Position', 'AnchorPoint', 'BackgroundColor3', 'BackgroundTransparency', 'BorderSizePixel', 'Visible'],
      'TextLabel': ['Text', 'TextColor3', 'TextSize', 'Font', 'Size', 'Position', 'BackgroundTransparency'],
      'TextButton': ['Text', 'TextColor3', 'TextSize', 'Font', 'Size', 'Position', 'BackgroundColor3'],
      'ImageLabel': ['Image', 'Size', 'Position', 'BackgroundTransparency', 'ImageColor3'],
      'ImageButton': ['Image', 'Size', 'Position', 'BackgroundTransparency', 'ImageColor3'],
      'Sound': ['SoundId', 'Volume', 'Looped', 'PlayOnRemove'],
      'ScreenGui': ['ResetOnSpawn', 'IgnoreGuiInset', 'ZIndexBehavior'],
      'Folder': [],
      'Model': ['PrimaryPart'],
      'RemoteEvent': [],
      'RemoteFunction': [],
      'BindableEvent': [],
      'BindableFunction': [],
    };

    const priority = priorityByClass[className] || [];
    const result: typeof props = [];
    const seen = new Set<string>();

    // Add priority properties first
    for (const propName of priority) {
      const prop = props.find(p => p.name === propName);
      if (prop && !seen.has(prop.name)) {
        result.push(prop);
        seen.add(prop.name);
      }
    }

    // Add remaining properties (own class first, then inherited)
    for (const prop of props) {
      if (!seen.has(prop.name) && prop.definedIn === className) {
        result.push(prop);
        seen.add(prop.name);
      }
    }

    // Add inherited properties
    for (const prop of props) {
      if (!seen.has(prop.name)) {
        result.push(prop);
        seen.add(prop.name);
      }
    }

    return result;
  }

  /**
   * Generate property value template with tab stops (for full class templates)
   * Uses multi-line format - assumes property is at 2-tab level (inside "properties")
   */
  private getPropertyValueTemplate(propName: string, expectedType: PropertyType | 'Enum' | 'Ref' | undefined, startTabStop: number): string {
    // Indentation: property at 2 tabs, content at 3 tabs, nested at 4 tabs
    if (!expectedType) {
      return `"${propName}": {\n\t\t\t"type": "\${${startTabStop}}",\n\t\t\t"value": \${${startTabStop + 1}}\n\t\t}`;
    }

    switch (expectedType) {
      case 'bool':
        return `"${propName}": {\n\t\t\t"type": "bool",\n\t\t\t"value": \${${startTabStop}|true,false|}\n\t\t}`;
      case 'int':
      case 'int64':
      case 'float':
      case 'double':
        return `"${propName}": {\n\t\t\t"type": "${expectedType}",\n\t\t\t"value": \${${startTabStop}:0}\n\t\t}`;
      case 'string':
      case 'Content':
        return `"${propName}": {\n\t\t\t"type": "${expectedType}",\n\t\t\t"value": "\${${startTabStop}}"\n\t\t}`;
      case 'Vector3':
        return `"${propName}": {\n\t\t\t"type": "Vector3",\n\t\t\t"value": {\n\t\t\t\t"x": \${${startTabStop}:0},\n\t\t\t\t"y": \${${startTabStop + 1}:0},\n\t\t\t\t"z": \${${startTabStop + 2}:0}\n\t\t\t}\n\t\t}`;
      case 'Vector2':
        return `"${propName}": {\n\t\t\t"type": "Vector2",\n\t\t\t"value": {\n\t\t\t\t"x": \${${startTabStop}:0},\n\t\t\t\t"y": \${${startTabStop + 1}:0}\n\t\t\t}\n\t\t}`;
      case 'Color3':
        return `"${propName}": {\n\t\t\t"type": "Color3",\n\t\t\t"value": {\n\t\t\t\t"r": \${${startTabStop}:1},\n\t\t\t\t"g": \${${startTabStop + 1}:1},\n\t\t\t\t"b": \${${startTabStop + 2}:1}\n\t\t\t}\n\t\t}`;
      case 'CFrame':
        return `"${propName}": {\n\t\t\t"type": "CFrame",\n\t\t\t"value": {\n\t\t\t\t"position": [\${${startTabStop}:0}, \${${startTabStop + 1}:0}, \${${startTabStop + 2}:0}],\n\t\t\t\t"rotation": [1, 0, 0, 0, 1, 0, 0, 0, 1]\n\t\t\t}\n\t\t}`;
      case 'Enum':
        return `"${propName}": {\n\t\t\t"type": "Enum",\n\t\t\t"value": {\n\t\t\t\t"enumType": "\${${startTabStop}}",\n\t\t\t\t"value": "\${${startTabStop + 1}}"\n\t\t\t}\n\t\t}`;
      case 'Ref':
        return `"${propName}": {\n\t\t\t"type": "Ref",\n\t\t\t"value": null\n\t\t}`;
      case 'UDim2':
        return `"${propName}": {\n\t\t\t"type": "UDim2",\n\t\t\t"value": {\n\t\t\t\t"x": {\n\t\t\t\t\t"scale": \${${startTabStop}:0},\n\t\t\t\t\t"offset": \${${startTabStop + 1}:0}\n\t\t\t\t},\n\t\t\t\t"y": {\n\t\t\t\t\t"scale": \${${startTabStop + 2}:0},\n\t\t\t\t\t"offset": \${${startTabStop + 3}:0}\n\t\t\t\t}\n\t\t\t}\n\t\t}`;
      case 'BrickColor':
        return `"${propName}": {\n\t\t\t"type": "BrickColor",\n\t\t\t"value": \${${startTabStop}:194}\n\t\t}`;
      default:
        return `"${propName}": {\n\t\t\t"type": "${expectedType}",\n\t\t\t"value": \${${startTabStop}}\n\t\t}`;
    }
  }

  /**
   * Count tab stops in a template string
   */
  private countTabStops(template: string): number {
    const matches = template.match(/\$\{(\d+)/g);
    if (!matches) return 0;
    const numbers = matches.map(m => parseInt(m.replace('${', '')));
    return Math.max(...numbers) - Math.min(...numbers) + 1;
  }

  /**
   * Completions for property names in properties object
   * Inserts full property structure with type and value
   */
  private getPropertyKeyCompletions(context: DocumentContext): CompletionItem[] {
    if (!context.className) {
      return [];
    }

    const properties = this.apiDump.getSerializableProperties(context.className);

    const filtered = properties
      .filter(prop => prop.name.toLowerCase().startsWith(context.prefix.toLowerCase()));

    return filtered.map((prop, index) => {
      const expectedType = this.apiDump.getExpectedType(context.className!, prop.name);

      // Generate full property template with type and value
      const snippetText = this.getPropertyInsertText(prop.name, expectedType);

      return {
        label: prop.name,
        kind: CompletionItemKind.Property,
        detail: `${prop.valueType.Name}${prop.definedIn !== context.className ? ` (from ${prop.definedIn})` : ''}`,
        documentation: {
          kind: MarkupKind.Markdown,
          value: this.getPropertyDocumentation(prop),
        },
        // Use textEdit to replace user's prefix with correctly-cased snippet
        textEdit: TextEdit.replace(context.range, snippetText),
        insertTextFormat: InsertTextFormat.Snippet,
        filterText: prop.name.toLowerCase(),
        sortText: prop.definedIn === context.className ? '00' + prop.name : '01' + prop.name,
        preselect: index === 0,
      };
    });
  }

  /**
   * Completions for keys inside a property value object (type, value, enumType)
   */
  private getPropertyValueKeyCompletions(context: DocumentContext): CompletionItem[] {
    // The valid keys inside a property value object
    const keys = ['type', 'value'];

    // If we know this property is an enum type, also suggest enumType
    if (context.className && context.propertyName) {
      const expectedType = this.apiDump.getExpectedType(context.className, context.propertyName);
      if (expectedType === 'Enum') {
        // For enum, the value field contains { enumType, value }
        // But at this level, we still just have type and value
      }
    }

    return keys
      .filter(key => key.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((key, index) => ({
        label: key,
        kind: CompletionItemKind.Field,
        detail: key === 'type' ? 'Property type (bool, string, Enum, etc.)' : 'Property value',
        textEdit: TextEdit.replace(context.range, key),
        insertTextFormat: InsertTextFormat.PlainText,
        sortText: '00' + index.toString().padStart(2, '0'),
        preselect: index === 0,
        filterText: key.toLowerCase(),
      }));
  }

  /**
   * Completions for keys inside an enum value object (enumType, value)
   */
  private getEnumValueKeyCompletions(context: DocumentContext): CompletionItem[] {
    const keys = ['enumType', 'value'];

    return keys
      .filter(key => key.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((key, index) => ({
        label: key,
        kind: CompletionItemKind.Field,
        detail: key === 'enumType' ? 'The enum type name' : 'The enum value',
        textEdit: TextEdit.replace(context.range, key),
        insertTextFormat: InsertTextFormat.PlainText,
        sortText: '00' + index.toString().padStart(2, '0'),
        preselect: index === 0,
        filterText: key.toLowerCase(),
      }));
  }

  /**
   * Completions for keys inside a struct value object.
   * These MUST match the exact field names from rbxsync-core/src/types/properties.rs
   */
  private getStructFieldKeyCompletions(context: DocumentContext): CompletionItem[] {
    // Struct field definitions - MUST match Rust serialization exactly
    const structFields: Record<string, { fields: string[], descriptions: Record<string, string> }> = {
      // Vector types
      'Vector2': {
        fields: ['x', 'y'],
        descriptions: { x: 'X component (f32)', y: 'Y component (f32)' }
      },
      'Vector2int16': {
        fields: ['x', 'y'],
        descriptions: { x: 'X component (i16)', y: 'Y component (i16)' }
      },
      'Vector3': {
        fields: ['x', 'y', 'z'],
        descriptions: { x: 'X component (f32)', y: 'Y component (f32)', z: 'Z component (f32)' }
      },
      'Vector3int16': {
        fields: ['x', 'y', 'z'],
        descriptions: { x: 'X component (i16)', y: 'Y component (i16)', z: 'Z component (i16)' }
      },
      // Transform types
      'CFrame': {
        fields: ['position', 'rotation'],
        descriptions: { position: 'Position array [x, y, z]', rotation: 'Rotation matrix [9 floats]' }
      },
      // Color types
      'Color3': {
        fields: ['r', 'g', 'b'],
        descriptions: { r: 'Red (0.0-1.0)', g: 'Green (0.0-1.0)', b: 'Blue (0.0-1.0)' }
      },
      'Color3uint8': {
        fields: ['r', 'g', 'b'],
        descriptions: { r: 'Red (0-255)', g: 'Green (0-255)', b: 'Blue (0-255)' }
      },
      // UI types
      'UDim': {
        fields: ['scale', 'offset'],
        descriptions: { scale: 'Scale factor (f32)', offset: 'Pixel offset (i32)' }
      },
      'UDim2': {
        fields: ['x', 'y'],
        descriptions: { x: 'X dimension (UDim object)', y: 'Y dimension (UDim object)' }
      },
      'Rect': {
        fields: ['min', 'max'],
        descriptions: { min: 'Min corner (Vector2 object)', max: 'Max corner (Vector2 object)' }
      },
      // Sequence types
      'NumberSequence': {
        fields: ['keypoints'],
        descriptions: { keypoints: 'Array of {time, value, envelope}' }
      },
      'ColorSequence': {
        fields: ['keypoints'],
        descriptions: { keypoints: 'Array of {time, color}' }
      },
      'NumberRange': {
        fields: ['min', 'max'],
        descriptions: { min: 'Minimum value (f32)', max: 'Maximum value (f32)' }
      },
      // Enum type
      'Enum': {
        fields: ['enumType', 'value'],
        descriptions: { enumType: 'Enum type name', value: 'Enum value name' }
      },
      // Reference types
      'SharedString': {
        fields: ['hash', 'file'],
        descriptions: { hash: 'Content hash', file: 'Optional file path' }
      },
      // Font type
      'Font': {
        fields: ['family', 'weight', 'style'],
        descriptions: { family: 'Font family name', weight: 'Font weight', style: 'Font style' }
      },
      // Face/Axes types
      'Faces': {
        fields: ['top', 'bottom', 'left', 'right', 'front', 'back'],
        descriptions: { top: 'Top face (bool)', bottom: 'Bottom face (bool)', left: 'Left face (bool)', right: 'Right face (bool)', front: 'Front face (bool)', back: 'Back face (bool)' }
      },
      'Axes': {
        fields: ['x', 'y', 'z'],
        descriptions: { x: 'X axis enabled (bool)', y: 'Y axis enabled (bool)', z: 'Z axis enabled (bool)' }
      },
      // Physics types
      'PhysicalProperties': {
        fields: ['density', 'friction', 'elasticity', 'friction_weight', 'elasticity_weight'],
        descriptions: {
          density: 'Material density (f32)',
          friction: 'Surface friction (f32)',
          elasticity: 'Bounciness (f32)',
          friction_weight: 'Friction blend weight (f32)',
          elasticity_weight: 'Elasticity blend weight (f32)'
        }
      },
      'Ray': {
        fields: ['origin', 'direction'],
        descriptions: { origin: 'Ray origin (Vector3 object)', direction: 'Ray direction (Vector3 object)' }
      },
      'Region3': {
        fields: ['min', 'max'],
        descriptions: { min: 'Min corner (Vector3 object)', max: 'Max corner (Vector3 object)' }
      },
      'Region3int16': {
        fields: ['min', 'max'],
        descriptions: { min: 'Min corner (Vector3int16 object)', max: 'Max corner (Vector3int16 object)' }
      },
    };

    const typeInfo = structFields[context.propertyType || ''];
    if (!typeInfo) {
      console.log(`[getStructFieldKeyCompletions] Unknown struct type: ${context.propertyType}`);
      return [];
    }

    console.log(`[getStructFieldKeyCompletions] Type=${context.propertyType}, fields=${typeInfo.fields.join(', ')}`);

    return typeInfo.fields
      .filter(field => field.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((field, index) => ({
        label: field,
        kind: CompletionItemKind.Field,
        detail: typeInfo.descriptions[field] || `${context.propertyType} field`,
        textEdit: TextEdit.replace(context.range, field),
        insertTextFormat: InsertTextFormat.PlainText,
        sortText: '00' + index.toString().padStart(2, '0'),
        preselect: index === 0,
        filterText: field.toLowerCase(),
      }));
  }

  /**
   * Completions for type field values - ONLY shows the valid type for this property
   */
  private getTypeCompletions(context: DocumentContext): CompletionItem[] {
    console.log(`[getTypeCompletions] className=${context.className}, propertyName=${context.propertyName}, prefix="${context.prefix}"`);

    // Get the expected type for this specific property
    if (context.className && context.propertyName) {
      const expectedType = this.apiDump.getExpectedType(context.className, context.propertyName);
      console.log(`[getTypeCompletions] expectedType=${expectedType}`);

      if (expectedType) {
        // Only suggest the expected type if it matches the prefix (case-insensitive)
        if (expectedType.toLowerCase().startsWith(context.prefix.toLowerCase())) {
          return [{
            label: expectedType,
            kind: CompletionItemKind.TypeParameter,
            detail: `Type for ${context.propertyName}`,
            textEdit: TextEdit.replace(context.range, expectedType),
            sortText: '0000',
            preselect: true,
            filterText: expectedType.toLowerCase(),
          }];
        }
        console.log(`[getTypeCompletions] Prefix "${context.prefix}" doesn't match expected type "${expectedType}"`);
        return []; // Prefix doesn't match the expected type
      }
    }

    console.log(`[getTypeCompletions] FALLBACK: showing all types (className=${context.className}, propertyName=${context.propertyName})`);
    // Fallback: if we don't know the property, show all types
    const types = [...PROPERTY_TYPES, 'Enum', 'Ref'] as const;

    return types
      .filter(type => type.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((type, index) => ({
        label: type,
        kind: CompletionItemKind.TypeParameter,
        textEdit: TextEdit.replace(context.range, type),
        sortText: '00' + index.toString().padStart(2, '0'),
        preselect: index === 0,
        filterText: type.toLowerCase(),
      }));
  }

  /**
   * Completions for enumType field - ONLY shows the valid enum type for this property
   */
  private getEnumTypeCompletions(context: DocumentContext): CompletionItem[] {
    console.log(`[getEnumTypeCompletions] className=${context.className}, propertyName=${context.propertyName}, prefix="${context.prefix}"`);

    // Get the expected enum type for this specific property
    if (context.className && context.propertyName) {
      const prop = this.apiDump.getPropertyInfo(context.className, context.propertyName);
      console.log(`[getEnumTypeCompletions] prop=${prop ? prop.name : 'null'}, valueType=${prop ? JSON.stringify(prop.valueType) : 'null'}`);

      if (prop && prop.valueType.Category === 'Enum') {
        const expectedEnumType = prop.valueType.Name;
        console.log(`[getEnumTypeCompletions] expectedEnumType=${expectedEnumType}`);

        // Only suggest the expected enum type if it matches the prefix (case-insensitive)
        if (expectedEnumType.toLowerCase().startsWith(context.prefix.toLowerCase())) {
          return [{
            label: expectedEnumType,
            kind: CompletionItemKind.Enum,
            detail: `Enum type for ${context.propertyName}`,
            textEdit: TextEdit.replace(context.range, expectedEnumType),
            sortText: '0000',
            preselect: true,
            filterText: expectedEnumType.toLowerCase(),
          }];
        }
        return []; // Prefix doesn't match
      }
    }

    console.log(`[getEnumTypeCompletions] Fallback: showing all enum types`);
    // Fallback: if we don't know the property, show all enum types
    const enumNames = this.apiDump.getAllEnumNames();

    return enumNames
      .filter(name => name.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((name, index) => ({
        label: name,
        kind: CompletionItemKind.Enum,
        textEdit: TextEdit.replace(context.range, name),
        sortText: '00' + index.toString().padStart(3, '0'),
        preselect: index === 0,
        filterText: name.toLowerCase(),
      }));
  }

  /**
   * Completions for enum value field
   */
  private getEnumValueCompletions(context: DocumentContext): CompletionItem[] {
    let enumType = context.enumType;

    // If enumType not found in context, try to infer from property
    if (!enumType && context.className && context.propertyName) {
      const prop = this.apiDump.getPropertyInfo(context.className, context.propertyName);
      if (prop && prop.valueType.Category === 'Enum') {
        enumType = prop.valueType.Name;
        console.log(`[getEnumValueCompletions] Inferred enumType=${enumType} from property ${context.propertyName}`);
      }
    }

    if (!enumType) {
      console.log(`[getEnumValueCompletions] No enumType found, returning empty`);
      return [];
    }

    console.log(`[getEnumValueCompletions] Using enumType=${enumType}, prefix="${context.prefix}"`);
    const enumValues = this.apiDump.getEnumValues(enumType);

    return enumValues
      .filter(item => item.Name.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((item, index) => ({
        label: item.Name,
        kind: CompletionItemKind.EnumMember,
        detail: `${enumType}.${item.Name} = ${item.Value}`,
        textEdit: TextEdit.replace(context.range, item.Name),
        sortText: '00' + index.toString().padStart(3, '0'),
        preselect: index === 0,
        filterText: item.Name.toLowerCase(),
      }));
  }

  /**
   * Completions for value field - type-aware suggestions
   */
  private getValueFieldCompletions(context: DocumentContext): CompletionItem[] {
    if (!context.propertyType) {
      return [];
    }

    // Provide completions based on the property type
    switch (context.propertyType) {
      case 'bool':
        // Boolean values: true or false
        return ['true', 'false']
          .filter(v => v.startsWith(context.prefix.toLowerCase()))
          .map((v, index) => ({
            label: v,
            kind: CompletionItemKind.Value,
            detail: 'Boolean value',
            insertText: v,
            sortText: '00' + index.toString().padStart(2, '0'),
            preselect: index === 0,
            filterText: v,
          }));

      case 'int':
      case 'int64':
      case 'float':
      case 'double':
      case 'SecurityCapabilities':
        // Numeric values - always suggest 0 as default
        // Use high priority to override other suggestions
        return [{
          label: '0',
          kind: CompletionItemKind.Value,
          detail: context.propertyType === 'SecurityCapabilities'
            ? 'SecurityCapabilities bitmask (u64) - 0 = none'
            : `${context.propertyType} value`,
          documentation: {
            kind: MarkupKind.Markdown,
            value: context.propertyType === 'SecurityCapabilities'
              ? '**SecurityCapabilities** is a numeric bitmask (u64), **NOT** an object with boolean fields.\n\nUse `0` for no capabilities.'
              : `Numeric ${context.propertyType} value`,
          },
          insertText: '0',
          sortText: '!0000', // ! sorts before letters/numbers
          preselect: true,
          // Don't set filterText - let VS Code use the label for filtering
        }];

      case 'string':
      case 'Content':
      case 'ProtectedString':
        // String values - no specific suggestions
        return [];

      case 'Vector3':
        return this.getStructFieldCompletions(['x', 'y', 'z']);
      case 'Vector2':
        return this.getStructFieldCompletions(['x', 'y']);
      case 'Color3':
        return this.getStructFieldCompletions(['r', 'g', 'b']);
      case 'UDim':
        return this.getStructFieldCompletions(['scale', 'offset']);
      case 'UDim2':
        return [
          {
            label: 'x',
            kind: CompletionItemKind.Field,
            insertText: '"x": { "scale": ${1:0}, "offset": ${2:0} }',
            insertTextFormat: InsertTextFormat.Snippet,
          },
          {
            label: 'y',
            kind: CompletionItemKind.Field,
            insertText: '"y": { "scale": ${1:0}, "offset": ${2:0} }',
            insertTextFormat: InsertTextFormat.Snippet,
          },
        ];
      case 'Enum':
        return [
          {
            label: 'enumType',
            kind: CompletionItemKind.Field,
            insertText: '"enumType": "${1}"',
            insertTextFormat: InsertTextFormat.Snippet,
          },
          {
            label: 'value',
            kind: CompletionItemKind.Field,
            insertText: '"value": "${1}"',
            insertTextFormat: InsertTextFormat.Snippet,
          },
        ];
      default:
        return [];
    }
  }

  /**
   * Completions for when user is inside an object but the type expects a primitive.
   * Provides a "fix" completion that replaces the entire wrong value.
   */
  private getWrongValueStructureCompletions(context: DocumentContext): CompletionItem[] {
    if (!context.propertyType || !context.valueRange) {
      console.log('[getWrongValueStructureCompletions] Missing propertyType or valueRange');
      return [];
    }

    console.log(`[getWrongValueStructureCompletions] Providing fix for ${context.propertyType}`);

    // Determine the correct value based on the type
    let correctValue: string;
    let detail: string;

    switch (context.propertyType) {
      case 'bool':
        correctValue = 'false';
        detail = 'Fix: bool value should be true or false, not an object';
        break;
      case 'int':
      case 'int64':
      case 'float':
      case 'double':
      case 'SecurityCapabilities':
        correctValue = '0';
        detail = context.propertyType === 'SecurityCapabilities'
          ? 'Fix: SecurityCapabilities is a numeric bitmask (u64), not an object'
          : `Fix: ${context.propertyType} should be a number, not an object`;
        break;
      case 'string':
      case 'Content':
      case 'ProtectedString':
      case 'BinaryString':
        correctValue = '""';
        detail = `Fix: ${context.propertyType} should be a string, not an object`;
        break;
      case 'BrickColor':
        correctValue = '194';
        detail = 'Fix: BrickColor should be a number (color code), not an object';
        break;
      case 'UniqueId':
        correctValue = '""';
        detail = 'Fix: UniqueId should be a string, not an object';
        break;
      case 'Ref':
        correctValue = 'null';
        detail = 'Fix: Ref should be a string or null, not an object';
        break;
      default:
        correctValue = 'null';
        detail = `Fix: ${context.propertyType} has wrong structure`;
    }

    return [{
      label: `⚠️ Fix: Replace with ${correctValue}`,
      kind: CompletionItemKind.Event, // Use Event for visibility (yellow icon)
      detail,
      documentation: {
        kind: MarkupKind.Markdown,
        value: `**Structure Error**\n\nThe \`value\` field for type \`${context.propertyType}\` should be \`${correctValue}\`, not an object.\n\nSelecting this will replace the entire value.`,
      },
      textEdit: TextEdit.replace(context.valueRange, correctValue),
      sortText: '!0000', // Sort first
      preselect: true,
      filterText: '', // Match anything
    }];
  }

  /**
   * Completions for originalType field - shows original Roblox types that differ from serialized type
   */
  private getOriginalTypeCompletions(context: DocumentContext): CompletionItem[] {
    // Original types that get serialized to a different type
    // These are the types that appear in extracted .rbxjson files
    const originalTypes = [
      { name: 'ContentId', serializedAs: 'string', description: 'Asset URL reference (rbxassetid://)' },
      { name: 'BinaryString', serializedAs: 'string', description: 'Binary data as base64 string' },
      { name: 'ProtectedString', serializedAs: 'string', description: 'Script source code' },
      { name: 'OptionalCoordinateFrame', serializedAs: 'CFrame', description: 'Optional CFrame (can be null)' },
      { name: 'SharedString', serializedAs: 'string', description: 'Shared content reference' },
      { name: 'QDir', serializedAs: 'string', description: 'Directory path' },
      { name: 'QFont', serializedAs: 'Font', description: 'Font specification' },
    ];

    return originalTypes
      .filter(t => t.name.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((t, index) => ({
        label: t.name,
        kind: CompletionItemKind.TypeParameter,
        detail: `→ ${t.serializedAs}`,
        documentation: {
          kind: MarkupKind.Markdown,
          value: `**${t.name}**\n\n${t.description}\n\nSerialized as: \`${t.serializedAs}\``,
        },
        textEdit: TextEdit.replace(context.range, t.name),
        sortText: '00' + index.toString().padStart(2, '0'),
        preselect: index === 0,
        filterText: t.name.toLowerCase(),
      }));
  }

  /**
   * Completions for attribute keys
   * Provides common attribute name suggestions
   */
  private getAttributeKeyCompletions(context: DocumentContext): CompletionItem[] {
    // Common attribute naming patterns
    const commonAttributes = [
      { name: 'Health', detail: 'Numeric health value' },
      { name: 'MaxHealth', detail: 'Maximum health value' },
      { name: 'Speed', detail: 'Movement speed' },
      { name: 'Damage', detail: 'Damage value' },
      { name: 'Level', detail: 'Level/tier value' },
      { name: 'Cost', detail: 'Price/cost value' },
      { name: 'Enabled', detail: 'Boolean toggle' },
      { name: 'Locked', detail: 'Boolean lock state' },
      { name: 'ID', detail: 'Unique identifier' },
      { name: 'Type', detail: 'Type classification' },
      { name: 'Name', detail: 'Display name' },
      { name: 'Description', detail: 'Text description' },
    ];

    return commonAttributes
      .filter(attr => attr.name.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((attr, index) => ({
        label: attr.name,
        kind: CompletionItemKind.Property,
        detail: attr.detail,
        textEdit: TextEdit.replace(context.range, `"${attr.name}": \${1}`),
        insertTextFormat: InsertTextFormat.Snippet,
        filterText: attr.name.toLowerCase(),
        sortText: '00' + index.toString().padStart(2, '0'),
      }));
  }

  /**
   * Completions for attribute values
   * Provides type templates for attribute values
   */
  private getAttributeValueCompletions(context: DocumentContext): CompletionItem[] {
    // Attributes support: string, number, boolean, Vector3, Color3, etc.
    const attributeTypes = [
      { label: 'string', snippet: '""', detail: 'String value' },
      { label: 'number', snippet: '0', detail: 'Numeric value' },
      { label: 'boolean', snippet: 'true', detail: 'Boolean value' },
      { label: 'Vector3', snippet: '{ "x": 0, "y": 0, "z": 0 }', detail: 'Vector3 value' },
      { label: 'Color3', snippet: '{ "r": 1, "g": 1, "b": 1 }', detail: 'Color3 value' },
      { label: 'UDim', snippet: '{ "scale": 0, "offset": 0 }', detail: 'UDim value' },
      { label: 'UDim2', snippet: '{ "x": { "scale": 0, "offset": 0 }, "y": { "scale": 0, "offset": 0 } }', detail: 'UDim2 value' },
    ];

    return attributeTypes.map((t, index) => ({
      label: t.label,
      kind: CompletionItemKind.Value,
      detail: t.detail,
      textEdit: TextEdit.replace(context.range, t.snippet),
      filterText: t.label.toLowerCase(),
      sortText: '00' + index.toString().padStart(2, '0'),
    }));
  }

  /**
   * Completions for CollectionService tags
   * Provides common tag suggestions
   */
  private getTagCompletions(context: DocumentContext): CompletionItem[] {
    // Common tag patterns used in Roblox games
    const commonTags = [
      { name: 'Interactable', detail: 'Can be interacted with' },
      { name: 'Collectable', detail: 'Can be collected by player' },
      { name: 'Damageable', detail: 'Can take damage' },
      { name: 'NPC', detail: 'Non-player character' },
      { name: 'Enemy', detail: 'Hostile entity' },
      { name: 'Player', detail: 'Player-related object' },
      { name: 'Checkpoint', detail: 'Spawn/save point' },
      { name: 'Trigger', detail: 'Trigger zone' },
      { name: 'Spawner', detail: 'Object spawner' },
      { name: 'Destructible', detail: 'Can be destroyed' },
      { name: 'Teleporter', detail: 'Teleport zone' },
      { name: 'Door', detail: 'Door/gate object' },
      { name: 'Animated', detail: 'Has animations' },
      { name: 'Sound', detail: 'Sound emitter' },
      { name: 'Effect', detail: 'Visual effect' },
    ];

    return commonTags
      .filter(tag => tag.name.toLowerCase().startsWith(context.prefix.toLowerCase()))
      .map((tag, index) => ({
        label: tag.name,
        kind: CompletionItemKind.Keyword,
        detail: tag.detail,
        textEdit: TextEdit.replace(context.range, tag.name),
        filterText: tag.name.toLowerCase(),
        sortText: '00' + index.toString().padStart(2, '0'),
      }));
  }

  /**
   * Helper for struct field completions
   */
  private getStructFieldCompletions(fields: string[]): CompletionItem[] {
    return fields.map((field, i) => ({
      label: field,
      kind: CompletionItemKind.Field,
      insertText: `"${field}": \${${i + 1}:0}`,
      insertTextFormat: InsertTextFormat.Snippet,
    }));
  }

  /**
   * Generate insert text for a property with snippet (multi-line formatting)
   */
  private getPropertyInsertText(propName: string, expectedType?: PropertyType | 'Enum' | 'Ref'): string {
    // Use \n and \t for newlines/indentation - VS Code will adapt to user's settings
    if (!expectedType) {
      return `"${propName}": {\n\t"type": "\${1}",\n\t"value": \${2}\n}`;
    }

    switch (expectedType) {
      case 'bool':
        return `"${propName}": {\n\t"type": "bool",\n\t"value": \${1|true,false|}\n}`;

      case 'int':
      case 'int64':
      case 'float':
      case 'double':
      case 'SecurityCapabilities':
      case 'BrickColor':
        return `"${propName}": {\n\t"type": "${expectedType}",\n\t"value": \${1:0}\n}`;

      case 'string':
      case 'ProtectedString':
      case 'BinaryString':
      case 'UniqueId':
        return `"${propName}": {\n\t"type": "${expectedType}",\n\t"value": "\${1}"\n}`;

      case 'Content':
        return `"${propName}": {\n\t"originalType": "ContentId",\n\t"type": "string",\n\t"value": "\${1:rbxassetid://}"\n}`;

      case 'Vector3':
        return `"${propName}": {\n\t"type": "Vector3",\n\t"value": {\n\t\t"x": \${1:0},\n\t\t"y": \${2:0},\n\t\t"z": \${3:0}\n\t}\n}`;

      case 'Vector2':
        return `"${propName}": {\n\t"type": "Vector2",\n\t"value": {\n\t\t"x": \${1:0},\n\t\t"y": \${2:0}\n\t}\n}`;

      case 'Color3':
        return `"${propName}": {\n\t"type": "Color3",\n\t"value": {\n\t\t"r": \${1:1},\n\t\t"g": \${2:1},\n\t\t"b": \${3:1}\n\t}\n}`;

      case 'CFrame':
        return `"${propName}": {\n\t"type": "CFrame",\n\t"value": {\n\t\t"position": [\${1:0}, \${2:0}, \${3:0}],\n\t\t"rotation": [1, 0, 0, 0, 1, 0, 0, 0, 1]\n\t}\n}`;

      case 'Enum':
        return `"${propName}": {\n\t"type": "Enum",\n\t"value": {\n\t\t"enumType": "\${1}",\n\t\t"value": "\${2}"\n\t}\n}`;

      case 'Ref':
        return `"${propName}": {\n\t"type": "Ref",\n\t"value": null\n}`;

      case 'UDim':
        return `"${propName}": {\n\t"type": "UDim",\n\t"value": {\n\t\t"scale": \${1:0},\n\t\t"offset": \${2:0}\n\t}\n}`;

      case 'UDim2':
        return `"${propName}": {\n\t"type": "UDim2",\n\t"value": {\n\t\t"x": {\n\t\t\t"scale": \${1:0},\n\t\t\t"offset": \${2:0}\n\t\t},\n\t\t"y": {\n\t\t\t"scale": \${3:0},\n\t\t\t"offset": \${4:0}\n\t\t}\n\t}\n}`;

      case 'NumberRange':
        return `"${propName}": {\n\t"type": "NumberRange",\n\t"value": {\n\t\t"min": \${1:0},\n\t\t"max": \${2:1}\n\t}\n}`;

      case 'Rect':
        return `"${propName}": {\n\t"type": "Rect",\n\t"value": {\n\t\t"min": {\n\t\t\t"x": \${1:0},\n\t\t\t"y": \${2:0}\n\t\t},\n\t\t"max": {\n\t\t\t"x": \${3:0},\n\t\t\t"y": \${4:0}\n\t\t}\n\t}\n}`;

      case 'Vector2int16':
        return `"${propName}": {\n\t"type": "Vector2int16",\n\t"value": {\n\t\t"x": \${1:0},\n\t\t"y": \${2:0}\n\t}\n}`;

      case 'Vector3int16':
        return `"${propName}": {\n\t"type": "Vector3int16",\n\t"value": {\n\t\t"x": \${1:0},\n\t\t"y": \${2:0},\n\t\t"z": \${3:0}\n\t}\n}`;

      case 'Color3uint8':
        return `"${propName}": {\n\t"type": "Color3uint8",\n\t"value": {\n\t\t"r": \${1:255},\n\t\t"g": \${2:255},\n\t\t"b": \${3:255}\n\t}\n}`;

      case 'NumberSequence':
        return `"${propName}": {\n\t"type": "NumberSequence",\n\t"value": {\n\t\t"keypoints": [\n\t\t\t{ "time": 0, "value": \${1:0}, "envelope": 0 },\n\t\t\t{ "time": 1, "value": \${2:1}, "envelope": 0 }\n\t\t]\n\t}\n}`;

      case 'ColorSequence':
        return `"${propName}": {\n\t"type": "ColorSequence",\n\t"value": {\n\t\t"keypoints": [\n\t\t\t{ "time": 0, "color": { "r": \${1:1}, "g": \${2:1}, "b": \${3:1} } },\n\t\t\t{ "time": 1, "color": { "r": \${4:1}, "g": \${5:1}, "b": \${6:1} } }\n\t\t]\n\t}\n}`;

      case 'Font':
        return `"${propName}": {\n\t"type": "Font",\n\t"value": {\n\t\t"family": "\${1:rbxasset://fonts/families/SourceSansPro.json}",\n\t\t"weight": "\${2:Regular}",\n\t\t"style": "\${3:Normal}"\n\t}\n}`;

      case 'Faces':
        return `"${propName}": {\n\t"type": "Faces",\n\t"value": {\n\t\t"top": \${1:false},\n\t\t"bottom": \${2:false},\n\t\t"left": \${3:false},\n\t\t"right": \${4:false},\n\t\t"front": \${5:false},\n\t\t"back": \${6:false}\n\t}\n}`;

      case 'Axes':
        return `"${propName}": {\n\t"type": "Axes",\n\t"value": {\n\t\t"x": \${1:false},\n\t\t"y": \${2:false},\n\t\t"z": \${3:false}\n\t}\n}`;

      case 'PhysicalProperties':
        return `"${propName}": {\n\t"type": "PhysicalProperties",\n\t"value": {\n\t\t"density": \${1:1},\n\t\t"friction": \${2:0.3},\n\t\t"elasticity": \${3:0.5},\n\t\t"friction_weight": \${4:1},\n\t\t"elasticity_weight": \${5:1}\n\t}\n}`;

      case 'Ray':
        return `"${propName}": {\n\t"type": "Ray",\n\t"value": {\n\t\t"origin": { "x": \${1:0}, "y": \${2:0}, "z": \${3:0} },\n\t\t"direction": { "x": \${4:0}, "y": \${5:1}, "z": \${6:0} }\n\t}\n}`;

      case 'Region3':
        return `"${propName}": {\n\t"type": "Region3",\n\t"value": {\n\t\t"min": { "x": \${1:0}, "y": \${2:0}, "z": \${3:0} },\n\t\t"max": { "x": \${4:1}, "y": \${5:1}, "z": \${6:1} }\n\t}\n}`;

      case 'Region3int16':
        return `"${propName}": {\n\t"type": "Region3int16",\n\t"value": {\n\t\t"min": { "x": \${1:0}, "y": \${2:0}, "z": \${3:0} },\n\t\t"max": { "x": \${4:1}, "y": \${5:1}, "z": \${6:1} }\n\t}\n}`;

      case 'OptionalCFrame':
        return `"${propName}": {\n\t"type": "OptionalCFrame",\n\t"value": {\n\t\t"position": [\${1:0}, \${2:0}, \${3:0}],\n\t\t"rotation": [1, 0, 0, 0, 1, 0, 0, 0, 1]\n\t}\n}`;

      case 'SharedString':
        return `"${propName}": {\n\t"type": "SharedString",\n\t"value": {\n\t\t"hash": "\${1}",\n\t\t"file": "\${2}"\n\t}\n}`;

      default:
        return `"${propName}": {\n\t"type": "${expectedType}",\n\t"value": \${1}\n}`;
    }
  }

  /**
   * Get sort text to prioritize common classes
   */
  private getClassSortText(className: string): string {
    const commonClasses = [
      'Part', 'Script', 'LocalScript', 'ModuleScript', 'Folder',
      'Model', 'Frame', 'TextLabel', 'TextButton', 'ImageLabel',
      'Sound', 'ScreenGui', 'BillboardGui', 'RemoteEvent', 'RemoteFunction',
      'BindableEvent', 'BindableFunction', 'StringValue', 'NumberValue', 'BoolValue',
    ];

    const index = commonClasses.indexOf(className);
    if (index >= 0) {
      return '0' + index.toString().padStart(2, '0') + className;
    }
    return '1' + className;
  }

  /**
   * Generate documentation for a class
   */
  private getClassDocumentation(className: string): string {
    const chain = this.apiDump.getInheritanceChain(className);
    const classInfo = this.apiDump.getClassInfo(className);

    let doc = `**${className}**\n\n`;

    if (chain.length > 1) {
      doc += `Inherits: ${chain.slice(1).join(' → ')}\n\n`;
    }

    if (classInfo?.Tags && classInfo.Tags.length > 0) {
      doc += `Tags: ${classInfo.Tags.join(', ')}\n\n`;
    }

    const props = this.apiDump.getSerializableProperties(className);
    const ownProps = props.filter(p => p.definedIn === className);
    if (ownProps.length > 0) {
      doc += `**Properties** (${ownProps.length} own, ${props.length} total)\n`;
      doc += ownProps.slice(0, 10).map(p => `- ${p.name}: ${p.valueType.Name}`).join('\n');
      if (ownProps.length > 10) {
        doc += `\n- ... and ${ownProps.length - 10} more`;
      }
    }

    return doc;
  }

  /**
   * Generate documentation for a property
   */
  private getPropertyDocumentation(prop: {
    name: string;
    valueType: { Name: string; Category: string };
    definedIn: string;
    category: string;
    defaultValue?: string;
    tags: string[];
  }): string {
    let doc = `**${prop.name}**: ${prop.valueType.Name}\n\n`;

    if (prop.category) {
      doc += `Category: ${prop.category}\n`;
    }

    if (prop.definedIn) {
      doc += `Defined in: ${prop.definedIn}\n`;
    }

    if (prop.defaultValue) {
      doc += `Default: ${prop.defaultValue}\n`;
    }

    if (prop.tags.length > 0) {
      doc += `Tags: ${prop.tags.join(', ')}\n`;
    }

    return doc;
  }
}
