const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send("Backend is running 🚀");
});

app.get('/pods', (req, res) => {
  exec('kubectl get pods -o json', (err, stdout) => {
    if (err) {
      return res.status(500).json({
        message: "Kubernetes not connected yet"
      });
    }

    try {
      const data = JSON.parse(stdout);

      const pods = data.items.map(pod => ({
        name: pod.metadata.name,
        status: pod.status.phase,
        restarts: pod.status.containerStatuses?.[0]?.restartCount || 0
      }));

      res.json(pods);
    } catch (e) {
      res.status(500).json({ error: "Parsing error" });
    }
  });
});

app.listen(5001, () => console.log("Backend running on 5001"));
