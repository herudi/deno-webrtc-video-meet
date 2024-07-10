import { FC, Helmet } from "@nhttp/nhttp/jsx";
import Layout from "./Layout.tsx";

const ErrorComp: FC<{ code: number; message: string }> = (props) => {
  return (
    <Layout>
      <Helmet>
        <title>{props.code} : {props.message}</title>
      </Helmet>
      <div
        style={{
          textAlign: "center",
          width: "100%",
          marginTop: 100,
        }}
      >
        <h1 style={{ fontSize: "10rem", margin: 0 }}>{props.code}</h1>
        <h3>{props.message}</h3>
        <a style={{ color: "#8787d1" }} href="/">{"<<"} Back To Home</a>
      </div>
    </Layout>
  );
};

export default ErrorComp;
