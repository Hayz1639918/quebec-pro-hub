// Endpoint API pour récupérer l'adresse IP du client
// Ce fichier sera utilisé par le serveur de développement Vite

export default function handler(req, res) {
  // Récupérer l'IP réelle du client
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  
  res.status(200).json({ 
    ip: ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });
}
