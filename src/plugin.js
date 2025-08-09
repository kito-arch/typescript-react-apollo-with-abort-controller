import generate from "@babel/generator";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { plugin as basePlugin } from "@graphql-codegen/typescript-react-apollo";

const plugin = async (schema, documents, config, { outputFile }) => {
  const originalCode = await basePlugin(schema, documents, config, {
    outputFile,
  });

  const ast = parser.parse(originalCode.content, {
    sourceType: "module",
    plugins: ["typescript"],
  });

  ast.program.body.unshift(
    t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier("useAbortControllerWrapper"),
          t.identifier("useAbortControllerWrapper")
        ),
      ],
      t.stringLiteral("typescript-react-apollo-with-abort-controller/hooks")
    )
  );

  traverse(ast, {
    FunctionDeclaration(path) {
      const { id, params } = path.node;
      if (id && /^use\w+(LazyQuery|SuspenseQuery|Query)$/.test(id.name)) {
        const baseFunctionName = `${id.name}Base`;
        path.node.id.name = baseFunctionName;

        const originalFunctionName = id.name.replace("Base", "");

        const clonedParams = params.map((param) => t.cloneNode(param));

        const wrapperCall = t.exportNamedDeclaration(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier(originalFunctionName),
              t.arrowFunctionExpression(
                clonedParams,
                t.callExpression(t.identifier("useAbortControllerWrapper"), [
                  t.identifier(baseFunctionName),
                  ...clonedParams,
                ])
              )
            ),
          ])
        );

        path.insertBefore(wrapperCall);
      }
    },
  });

  const { code } = generate(ast, { retainLines: true });
  return code;
};

export { plugin };
