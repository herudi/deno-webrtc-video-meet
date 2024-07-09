import { FC } from "@nhttp/nhttp/jsx";
import Layout from "./layout.tsx";

export const Bad: FC<{ message: string }> = (props) => {
  return (
    <Layout>
      <h1>{props.message}</h1>
      <a class="my-input" href="/">{"<<"} Back To Home</a>
    </Layout>
  );
};
