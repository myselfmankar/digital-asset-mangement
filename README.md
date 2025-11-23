# PhotoStack: Your Intelligent, Private Photo Library ✨

**Tired of manually sorting through thousands of photos? PhotoStack is the smart, beautiful, and private home for your entire photo collection.**

PhotoStack goes beyond a simple gallery. It's a personal photo assistant that uses the power of Artificial Intelligence to automatically organize, tag, and prepare your photos for discovery. Simply upload your pictures—**including modern HEIC files from your iPhone or Samsung**—and let PhotoStack do the rest.

Rediscover your memories, beautifully organized and instantly searchable.

---

### Main Showcase
![PhotoStack Showcase](docs/images/photostack-carousel.gif)

| Gallery View | Album View | Map View |
| :---: | :---: | :---: |
| *![Gallery Screenshot](docs/images/placeholder-gallery.png)* | *![Albums Screenshot](docs/images/placeholder-albums.png)* | *![Map Screenshot](docs/images/placeholder-map.png)* |

---

## 🌟 Why You'll Love PhotoStack

### Intelligent Organization, Zero Effort
Say goodbye to manual tagging and folder creation. PhotoStack's AI engine, powered by Google's Gemini Pro, analyzes your images and automatically adds descriptive tags. It even suggests new albums, turning your chaotic collection into a curated library without you lifting a finger.

*   🧠 **AI-Powered Tagging:** Automatically understands the content of your photos and adds relevant tags like "beach," "sunset," or "cityscape."
*   📂 **Smart Album Suggestions:** Intelligently groups similar photos and suggests creating albums like "Beach Trip" or "Urban Exploration."
*   📱 **Modern Format Support:** Seamlessly handles `.HEIC` images from the latest smartphones, automatically converting them for universal viewing.
*   🗺️ **Automatic Geotagging:** Extracts GPS data to pinpoint where each photo was taken, complete with a human-readable address.

### Rediscover Your Memories
Your photos are a storybook of your life. PhotoStack gives you beautiful and intuitive ways to read it.

*   🖼️ **Elegant Photo Gallery:** A stunning, responsive grid that showcases your images in the best light, whether on a desktop or on the go.
*   📅 **Chronological Albums:** Automatically groups your photos by month and year, letting you journey back in time with ease.
*   🌍 **Interactive World Map:** Explore your travels visually! All geotagged photos are plotted on a beautiful world map, letting you see where your adventures have taken you.
*   💡 **Effortless Search & Filtering:** Quickly find exactly what you're looking for by filtering by date, camera model, location, or AI-generated tags.

### A Modern & Private Home for Your Photos
PhotoStack combines cutting-edge technology with a user-centric design, ensuring your photos are both secure and beautifully presented.

*   🌗 **Beautiful Themes:** Switch between a sleek dark mode and a clean light mode to match your style.
*   🔒 **You're in Control:** As a self-hosted application, your photos stay on your infrastructure. No third-party data mining, no privacy concerns.
*   🚀 **Powered by Modern Tech:** Built with a fast and reliable stack featuring Python, FastAPI, and LangChain for a smooth and responsive experience.

---
---

## 🚀 Join the Development & Contribute to Open Source

PhotoStack is a growing open-source project, and we welcome contributors of all skill levels! Whether you're a Pythonista, a frontend wizard, or just have great ideas, we'd love your help.

### Our Tech Stack
This project is built with a modern, containerized architecture:
*   **Backend:** FastAPI, Python, SQLAlchemy, PostgreSQL
*   **AI:** LangChain, Google Gemini 1.5 Pro
*   **Frontend:** Vanilla JavaScript, HTML5, CSS3
*   **Containerization:** Docker & Docker Compose

### How to Contribute
1.  **Fork the Repository:** Start by forking the project to your own GitHub account.
2.  **Set up the Development Environment:** We've made it easy to get started with Docker.
    *   Create a `.env` file from the `env.txt` template and add your `GEMINI_API_KEY`.
    *   Run `docker-compose up --build` to get the entire application running locally.
3.  **Find an Issue or Suggest an Idea:** Check out the [Issues tab](https://github.com/your-username/your-repo/issues) for tasks labeled `good first issue` or propose a new feature!
4.  **Follow the Code Structure:**
    *   `api/`: Contains the FastAPI backend, with subdirectories for `routers`, `services`, `models`, and `schemas`.
    *   `frontend/`: Holds all the vanilla JavaScript, HTML, and CSS for the user interface.
5.  **Submit a Pull Request:** Once you've made your changes, submit a PR and we'll review it together.

---

### Acknowledgements

This project is heavily inspired by the fantastic open-source applications **[PhotoPrism](https://www.photoprism.app/)** and **[PhotoView](https://photoview.github.io/)**. PhotoStack aims to bring some of their core concepts to the Python ecosystem, serving as a FastAPI-based alternative to these Go-powered applications. Please see `CITATIONS.md` for more details.
