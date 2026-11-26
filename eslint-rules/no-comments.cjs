"use strict";

const DIRECTIVES = [
  /^\s*eslint(-disable(-next-line|-line)?|-enable|-env)?(\s|$)/,
  /^\s*(global|globals|exported)\s/,
  /^\s*@ts-(expect-error|ignore|nocheck|check)\b/,
  /^\/\s*<reference\s/,
  /^\s*prettier-ignore\s*$/,
  /^\s*(design-system-raw-ok|text-metrics-ok)\b/,
  /^\s*[#@]__PURE__\s*$/,
  /^\s*@jest-environment\s/,
  /^\s*istanbul ignore\b/,
];

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow comments; tool directives are allowed. Decisions go in docs/adr/.",
    },
    schema: [],
    messages: {
      comment:
        "No comments. Make the code say it, or record the decision in docs/adr/ (see the /delete-comment skill).",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type === "Shebang") continue;
          if (DIRECTIVES.some((re) => re.test(comment.value))) continue;
          context.report({ loc: comment.loc, messageId: "comment" });
        }
      },
    };
  },
};
