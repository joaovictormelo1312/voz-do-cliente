export const AUTH_UNAVAILABLE_MESSAGE =
  "O acesso está temporariamente indisponível. Tente novamente mais tarde.";

export function getSignupErrorMessage(code: string | undefined) {
  switch (code) {
    case "weak_password":
      return "Esta senha não atende aos requisitos de segurança. Escolha uma senha mais forte.";
    case "email_address_invalid":
      return "Não foi possível aceitar este e-mail. Verifique o endereço informado.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas de cadastro. Aguarde um pouco e tente novamente.";
    case "signup_disabled":
      return "O cadastro está temporariamente indisponível. Tente novamente mais tarde.";
    default:
      return "Não foi possível criar a conta. Verifique os dados ou tente novamente mais tarde.";
  }
}
