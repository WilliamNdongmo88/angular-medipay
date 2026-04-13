export const environment = {
  production: false, // Change to true to activate production environment
  apiUrlDev: 'http://localhost:8008/api',
  brokerURLDev: 'ws://localhost:8008/ws',
  brokerURLProd: 'ws://medipay-solution-production.up.railway.app/ws',
  apiUrlProd:'https://medipay-solution-production.up.railway.app/api'
};
if (environment.production) {
  console.log("✅ Environment de Prduction chargé !");
}else{
  console.log("✅ Environment de Développement chargé !");
}
