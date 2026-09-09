// Façade publique de la feature auth : seul point d'entrée utilisable depuis app/
export { AuthTabs } from "./ui/AuthTabs";
export { logoutAction, deleteAccountAction, keepAccountAction } from "./application/actions";
export { isApprovedEmail } from "./application/access";
