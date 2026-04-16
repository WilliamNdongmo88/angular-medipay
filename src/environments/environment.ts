export const environment = {
  production: true, // Change to true to activate production environment
  apiUrlDev: 'http://localhost:8008/api',
  brokerURLDev: 'ws://localhost:8008/ws',
  brokerURLProd: 'ws://medipay-production.up.railway.app/ws',
  apiUrlProd:'https://medipay-production.up.railway.app/api'//medipay-production.up.railway.app
};

if (environment.production) {
  console.log("✅ Environment de Prduction chargé !");
}else{
  console.log("✅ Environment de Développement chargé !");
}
