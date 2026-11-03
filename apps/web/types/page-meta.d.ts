declare module '#app' {
  interface PageMeta {
    /** Роли, которым открыт раздел (data-roles у data-app-chrome прототипа). Допускаются старые id pm и employee. */
    roles?: string[]
  }
}

export {}
