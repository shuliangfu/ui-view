/**
 * JSX 固有元素类型：供 docs 内 TSX 类型检查使用。
 * 仅扩充常见元素，避免与 @dreamer/view 的 IntrinsicElements 索引签名重复。
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: Record<string, unknown>;
      span: Record<string, unknown>;
      a: Record<string, unknown>;
      button: Record<string, unknown>;
      input: Record<string, unknown>;
      form: Record<string, unknown>;
      label: Record<string, unknown>;
      p: Record<string, unknown>;
      ul: Record<string, unknown>;
      ol: Record<string, unknown>;
      li: Record<string, unknown>;
      h1: Record<string, unknown>;
      h2: Record<string, unknown>;
      h3: Record<string, unknown>;
      section: Record<string, unknown>;
      header: Record<string, unknown>;
      main: Record<string, unknown>;
      nav: Record<string, unknown>;
      img: Record<string, unknown>;
      svg: Record<string, unknown>;
      path: Record<string, unknown>;
      select: Record<string, unknown>;
      option: Record<string, unknown>;
      textarea: Record<string, unknown>;
      br: Record<string, unknown>;
      i: Record<string, unknown>;
      strong: Record<string, unknown>;
      small: Record<string, unknown>;
      html: Record<string, unknown>;
      head: Record<string, unknown>;
      meta: Record<string, unknown>;
      link: Record<string, unknown>;
      title: Record<string, unknown>;
      body: Record<string, unknown>;
      footer: Record<string, unknown>;
      aside: Record<string, unknown>;
      table: Record<string, unknown>;
      thead: Record<string, unknown>;
      tbody: Record<string, unknown>;
      tfoot: Record<string, unknown>;
      tr: Record<string, unknown>;
      th: Record<string, unknown>;
      td: Record<string, unknown>;
      circle: Record<string, unknown>;
      rect: Record<string, unknown>;
      polygon: Record<string, unknown>;
      polyline: Record<string, unknown>;
      line: Record<string, unknown>;
      defs: Record<string, unknown>;
      linearGradient: Record<string, unknown>;
      stop: Record<string, unknown>;
      ellipse: Record<string, unknown>;
      canvas: Record<string, unknown>;
      pre: Record<string, unknown>;
      code: Record<string, unknown>;
      style: Record<string, unknown>;
      datalist: Record<string, unknown>;
      h4: Record<string, unknown>;
      h5: Record<string, unknown>;
      h6: Record<string, unknown>;
    }
  }
}

export {};
