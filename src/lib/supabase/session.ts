// FR-012 pide que la sesión dure treinta días desde el último uso. `inactivity_timeout` del
// servicio hace justo eso, pero es de plan Pro y en el gratuito la sesión no vence nunca, así que
// el plazo lo sostiene la vida de la cookie, que se renueva en cada visita (KL-005).
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
