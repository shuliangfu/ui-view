/** 路由: /navigation/pagination */
import { createSignal } from "@dreamer/view";
import { Pagination, Paragraph, Title } from "@dreamer/ui-view";

export default function NavigationPagination() {
  const [page, setPage] = createSignal(1);
  const [pageSize, setPageSize] = createSignal(10);

  const handleChange = (p: number, ps?: number) => {
    setPage(p);
    if (ps != null) setPageSize(ps);
  };

  return (
    <div class="space-y-6">
      <Title level={1}>Pagination</Title>
      <Paragraph>
        分页：current、total、pageSize、onChange；上一页/下一页、快速跳转、showTotal、
        pageSizeOptions、极简模式（showPageNumbers: false）。
      </Paragraph>

      <Pagination
        current={page()}
        total={120}
        pageSize={pageSize()}
        pageSizeOptions={[10, 20, 50]}
        onChange={handleChange}
        showPrevNext
        showTotal
        showQuickJumper
      />

      <Pagination
        current={page()}
        totalPages={5}
        onChange={setPage}
        showPrevNext
      />

      <Paragraph>极简模式（仅上一页/下一页）：</Paragraph>
      <Pagination
        current={page()}
        total={120}
        pageSize={10}
        onChange={setPage}
        showPrevNext
        showPageNumbers={false}
        showTotal
      />
    </div>
  );
}
