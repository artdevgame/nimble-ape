import { Input } from "../ui/input";
import "@corbado/webcomponent/pkg/auth_cui.css";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "corbado-auth": unknown;
    }
  }
}

export const Auth = () => {
  return (
    <corbado-auth project-id={window.ENV.CORBADO_PROJECT_ID} conditional="yes">
      <Input
        id="corbado-username"
        name="username"
        required
        autoComplete="webauthn"
      />
    </corbado-auth>
  );
};
