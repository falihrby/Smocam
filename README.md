# SmoCam (Smoke Camera)

<img src="public/images/logo_smocam.png" alt="Smocam Logo" width="200"/>

SmoCam is a real-time smoke detection system leveraging YOLOv8 and IoT to monitor and log smoking activities.

## Key Features

- **Real-time Detection**: YOLOv8 running on Raspberry Pi for accurate, low-latency detection of conventional tobacco smoking.
- **IoT Messaging**: Publishes detection events (timestamp, floor, snapshot) via MQTT to a central server.
- **Web Dashboard**: React-based interface displaying interactive floor maps, detection markers, daily/weekly statistics, and trend charts.
- **Cloud Storage & Database**: Firebase Realtime Database for logging events and Firebase Storage for saving snapshot images.
- **Modular Design**: Clean separation of edge-device code (Python), messaging server (Node.js), and frontend (React).

## Contribution

We welcome contributions from the community. If you would like to contribute to this project, please open a new issue or submit a pull request after making changes.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contact

For further questions or technical support, please contact us at [falihrahmat534@gmail.com](mailto:falihrahmat534@gmail.com).

![Login Screenshot](public/images/login_smocam.png)
![Dashboard Screenshot](public/images/dashboard_smocam.png)
![Laporan Screenshot](public/images/laporan_smocam.png)
![Manajemen Perangkat Screenshot](public/images/manajemenperangkat_smocam.png)
![Perangkat Screenshot](public/images/detailperangkat_smocam.png)