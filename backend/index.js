const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(cors());

const KUBE_API = 'kubernetes.default.svc';
const TOKEN = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token');
const CA = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt');

app.get('/pods', (req, res) => {

  const options = {
    hostname: KUBE_API,
    port: 443,
    path: '/api/v1/namespaces/default/pods',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`
    },
    ca: CA
  };

  const request = https.request(options, response => {
    let data = '';

    response.on('data', chunk => {
      data += chunk;
    });

    response.on('end', () => {
      const parsed = JSON.parse(data);

      const pods = parsed.items.map(pod => ({
        name: pod.metadata.name,
        status: pod.status.phase,
        restarts:
          pod.status.containerStatuses &&
          pod.status.containerStatuses.length > 0
            ? pod.status.containerStatuses[0].restartCount
            : 0
      }));

      res.json(pods);
    });
  });

  request.on('error', err => {
    console.error(err);
    res.json({ message: 'Error connecting to Kubernetes API' });
  });

  request.end();
});

app.listen(5001, '0.0.0.0', () => {
  console.log("Backend running");
});
