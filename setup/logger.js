import tracer from "tracer";

export const log = tracer.colorConsole({
  format: [
    "<{{title}}> {{message}}", //default format
    {
      debug:
        "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}", // error format
      trace:
        "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}", // error format
      error:
        "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}", // error format
    },
  ],
  preprocess: function (data) {
    data.title = data.title.toUpperCase();
  },
});
