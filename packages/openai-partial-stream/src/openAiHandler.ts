import { StreamMode, StreamResponseWrapper, Status } from "./utils";
import { StreamParser } from "./streamParser";

export class OpenAiHandler {
    private itemIdx = 0;
    private noStreamBufferList: any = [];
    private parser: StreamParser;
    private mode: StreamMode;

    constructor(mode = StreamMode.StreamObjectKeyValueTokens) {
        this.mode = mode;
        this.parser = new StreamParser(this.mode);
    }

    async *process(
        stream: any,
    ): AsyncGenerator<StreamResponseWrapper | null, void, unknown> {
        for await (const msg of stream) {
            let content = "";

            content = msg.choices[0].delta.content;

            // If no content, check function calling content
            if (!content) {
                content = msg.choices[0]?.delta?.function_call?.arguments;
            }

            if (content === undefined) {
                continue;
            }

            const res = this.parser.parse(content);

            if (
                this.mode === StreamMode.NoStream ||
                this.mode === StreamMode.Batch
            ) {
                if (res) {
                    this.noStreamBufferList.push(res);
                }
            } else if (res) {
                yield res;
            }
        }

        if (this.mode === StreamMode.NoStream) {
            for (const item of this.noStreamBufferList) {
                yield item;
            }
        } else if (this.mode === StreamMode.Batch) {
            const streamRes: StreamResponseWrapper = {
                index: this.itemIdx,
                status: Status.COMPLETED,
                data: this.noStreamBufferList.map((item: any) => item.data),
            };
            yield streamRes;
        }
    }
}
