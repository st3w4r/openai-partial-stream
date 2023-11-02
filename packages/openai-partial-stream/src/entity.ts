import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { ParsedResponse, StreamResponseWrapper } from "./utils";

export class Entity<K extends string, T> {
    // The name of the entity
    private name: K;
    // Zod schema
    private schema: z.ZodType<T>;

    constructor(name: K, schema: z.ZodType<T>) {
        this.name = name;
        this.schema = schema;
    }

    generatePromptSchema() {
        const jsonSchema =
            zodToJsonSchema(this.schema, this.name)?.definitions?.[this.name] ??
            "";
        const strJsonSchema = JSON.stringify(jsonSchema);

        const prompt = `
        Format an array of json object to respect this json schema definition:
        ${strJsonSchema}
    
        Output as a json array:
        example: [{"name": "value"}, {"name": "value"}]
    
        Now convert to the JSON format, write directly to JSON. No explanation needed.
        `;
        return prompt;
    }

    parse(entityObject: unknown): T | null {
        const parserRes = this.schema.safeParse(entityObject);
        return parserRes.success ? parserRes.data : null;
    }

    async *genParse(
        entityObject: AsyncGenerator<
            StreamResponseWrapper | null,
            void,
            unknown
        >,
    ): AsyncIterable<ParsedResponse<K, T> | null> {
        for await (const item of entityObject) {
            const data = item && this.parse(item.data);
            yield item && data ? { ...item, data, entity: this.name } : null;
        }
    }

    async *genParseArray(
        entityObject: AsyncGenerator<
            StreamResponseWrapper | null,
            void,
            unknown
        >,
    ): AsyncIterable<ParsedResponse<K, T> | null> {
        for await (const item of entityObject) {
            if (item) {
                let childrens = item.data?.[this.name] ?? item.data;
                if (Array.isArray(childrens) && childrens.length > 0) {
                    let index = childrens.length - 1;
                    let data = this.parse(childrens[index]);
                    yield data && {
                        ...item,
                        entity: this.name,
                        index,
                        data,
                    };
                }
            }
        }
    }
}
