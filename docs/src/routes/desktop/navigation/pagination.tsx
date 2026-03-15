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
        分页：current、total、totalPages、pageSize、pageSizeOptions、onChange、showPrevNext、showPageNumbers、showQuickJumper、showTotal、disabled、class。
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

      <Title level={2}>极简模式（showPageNumbers=false）</Title>
      <Pagination
        current={page()}
        total={120}
        pageSize={10}
        onChange={setPage}
        showPrevNext
        showPageNumbers={false}
        showTotal
      />
      <Title level={2}>disabled</Title>
      <Pagination
        current={2}
        total={50}
        pageSize={10}
        onChange={() => {}}
        disabled
      />
    </div>
  );
}
