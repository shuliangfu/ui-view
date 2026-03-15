/**
 * 表单 - Upload（展示全部用法）
 * 路由: /form/upload
 */

import { Form, FormItem, Paragraph, Title, Upload } from "@dreamer/ui-view";
import type { UploadFile } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function FormUpload() {
  const [fileList, setFileList] = createSignal<UploadFile[]>([]);
  const [fileListWithProgress, setFileListWithProgress] = createSignal<
    UploadFile[]
  >([
    { uid: "1", name: "a.txt", status: "pending" },
    { uid: "2", name: "b.pdf", status: "uploading", progress: 60 },
    { uid: "3", name: "c.jpg", status: "done" },
    { uid: "4", name: "d.zip", status: "error" },
  ]);

  const handleChange = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const files = el.files;
    if (!files?.length) return;
    const next: UploadFile[] = Array.from(files).map((f, i) => ({
      uid: `f-${Date.now()}-${i}`,
      name: f.name,
      status: "pending" as const,
    }));
    setFileList((prev) => [...prev, ...next]);
  };

  const handleDrop = (files: File[]) => {
    const next: UploadFile[] = files.map((f, i) => ({
      uid: `d-${Date.now()}-${i}`,
      name: f.name,
      status: "pending" as const,
    }));
    setFileList((prev) => [...prev, ...next]);
  };

  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>Upload</Title>
        <Paragraph>
          文件上传：multiple、accept、fileList、onChange、onRemove、onDrop、drag、dragPlaceholder、disabled、name、id。
        </Paragraph>
      </div>

      <Form layout="vertical" class="max-w-md space-y-6">
        <section class="space-y-4">
          <Title level={2}>拖拽 + 列表 + 移除</Title>
          <FormItem label="点击或拖拽">
            <Upload
              multiple
              fileList={fileList()}
              onRemove={(i) =>
                setFileList((prev) => prev.filter((_, idx) => idx !== i))}
              onDrop={handleDrop}
              drag
              dragPlaceholder="点击或拖拽文件到此处"
              onChange={handleChange}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>
            文件列表（含 pending/uploading/done/error + progress）
          </Title>
          <FormItem label="各状态展示">
            <Upload
              fileList={fileListWithProgress()}
              onRemove={(i) =>
                setFileListWithProgress((prev) =>
                  prev.filter((_, idx) => idx !== i)
                )}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>仅选择（无 drag、无 fileList）</Title>
          <FormItem label="原生 file input">
            <Upload
              multiple
              accept="image/*"
              onChange={(e) =>
                console.log("选中", (e.target as HTMLInputElement).files)}
            />
          </FormItem>
        </section>

        <section class="space-y-4">
          <Title level={2}>disabled</Title>
          <FormItem label="禁用">
            <Upload disabled />
          </FormItem>
        </section>
      </Form>
    </div>
  );
}
