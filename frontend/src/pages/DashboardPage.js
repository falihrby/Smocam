import React, { useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/DashboardPage.css";

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedArea, setSelectedArea] = useState("Semua");
  const [selectedBox, setSelectedBox] = useState("Label for Box 1");
  const areaButtonsRef = useRef(null);
  const rectangleRef = useRef(null);

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  const toggleSidebar = () => setSidebarOpen((prevState) => !prevState);

  const handleMouseDrag = (e) => {
    e.preventDefault();
    const scrollContainer = areaButtonsRef.current;
    if (!scrollContainer) return;

    let startX = e.clientX || e.touches[0].clientX;
    let scrollLeft = scrollContainer.scrollLeft;

    const onMouseMove = (event) => {
      const x = event.clientX || event.touches[0].clientX;
      const walk = (startX - x) * 1.5;
      scrollContainer.scrollLeft = scrollLeft + walk;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onMouseMove);
      document.removeEventListener("touchend", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onMouseMove);
    document.addEventListener("touchend", onMouseUp);
  };

  const cardData = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 512 512">
          <path
            fill="#fff"
            d="M16 240v120h344V240zm312 88H48v-56h280Zm56-88h32v120h-32zm56 0h32v120h-32zm-54.572-66.7a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L385.377 48H348.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L364.77 200h38.46Zm72 0a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L457.377 48H420.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L436.77 200h38.46Z"
          />
        </svg>
      ),
      number: 4,
      label: "Terdeteksi Hari ini",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
          <path
            fill="#fff"
            d="M18.618 7.462L6.403 2.085a1 1 0 0 0-.77-.016a1 1 0 0 0-.552.537l-3 7a1 1 0 0 0 .525 1.313L9.563 13.9L8.323 17H4v-3H2v8h2v-3h4.323c.823 0 1.552-.494 1.856-1.258l1.222-3.054l3.419 1.465a1 1 0 0 0 1.311-.518l3-6.857a1 1 0 0 0-.513-1.316m1.312 8.91l-1.858-.742l1.998-5l1.858.741z"
          />
        </svg>
      ),
      number: 7,
      label: "CCTV",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 256 256">
          <path
            fill="#fff"
            d="M124 175a8 8 0 0 0 7.94 0c2.45-1.41 60-35 60-94.95A64 64 0 0 0 64 80c0 60 57.58 93.54 60 95m4-119a24 24 0 1 1-24 24a24 24 0 0 1 24-24m112 128c0 31.18-57.71 48-112 48S16 215.18 16 184c0-14.59 13.22-27.51 37.23-36.37a8 8 0 0 1 5.54 15C42.26 168.74 32 176.92 32 184c0 13.36 36.52 32 96 32s96-18.64 96-32c0-7.08-10.26-15.26-26.77-21.36a8 8 0 0 1 5.54-15C226.78 156.49 240 169.41 240 184"
          />
        </svg>
      ),
      number: 3,
      label: "Area",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
          <path fill="#fff" 
          d="M10.514 6.49a4.5 4.5 0 0 1 2.973 0l7.6 2.66c.803.282.803 1.418 0 1.7l-7.6 2.66a4.5 4.5 0 0 1-2.973 0l-5.509-1.93a1.24 1.24 0 0 0-.436.597a1 1 0 0 1 .013 1.635l.004.018l.875 3.939a.6.6 0 0 1-.585.73H3.125a.6.6 0 0 1-.586-.73l.875-3.94l.005-.017a1 1 0 0 1 .132-1.707a2.35 2.35 0 0 1 .413-.889l-1.05-.367c-.804-.282-.804-1.418 0-1.7z"/><path fill="#fff" d="m6.393 12.83l-.332 2.654c-.057.452.127.92.52 1.196c1.157.815 3.043 1.82 5.42 1.82a9 9 0 0 0 5.473-1.834c.365-.28.522-.727.47-1.152l-.336-2.685l-4.121 1.442a4.5 4.5 0 0 1-2.973 0z"
          />
        </svg>
      ),
      number: 15,
      label: "Mahasiswa",
    },
  ];

  const handleBoxClick = (boxLabel) => {
    setSelectedBox(boxLabel); 
    if (rectangleRef.current) {
      rectangleRef.current.scrollIntoView({ behavior: "smooth" }); 
    } else {
      console.warn("Rectangle ref is null. Check if the element exists.");
    }
  };  

  const areaButtons = [
    "Semua", "Area 1", "Area 2", "Area 3", "Area 4", 
    "Area 5", "Area 6", "Area 7", "Area 8", "Area 9", "Area 10"
  ];

  const detectedInfoData = new Array(6).fill({
    date: "02/02/2023 10:04:06",
    message: "Terdeteksi merokok",
    student: "Ada Mahasiswa",
  });

  return (
    <div className={`dashboard-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="dashboard-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <section className="dashboard-content">
          <div className="dashboard-row card-row">
            {cardData.map((card, index) => (
              <DashboardCard key={index} card={card} />
            ))}
          </div>
          <hr className="dashboard-divider" />
          <div className="dashboard-row two-columns">
            <LeftColumn
              areaButtons={areaButtons}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              areaButtonsRef={areaButtonsRef}
              handleMouseDrag={handleMouseDrag}
              selectedBox={selectedBox} 
              handleBoxClick={handleBoxClick} 
            />
            <RightColumn detectedInfoData={detectedInfoData} />
          </div>
        </section>
      </div>
    </div>
  );
};

const DashboardCard = ({ card }) => (
  <div className="dashboard-card">
    <div className="card-left">
      <div className="icon-box">{card.icon}</div>
    </div>
    <div className="card-right">
      <div className="card-number">{card.number}</div>
      <div className="card-label">{card.label}</div>
    </div>
  </div>
);

const LeftColumn = ({
  areaButtons, selectedArea, setSelectedArea, areaButtonsRef,
  handleMouseDrag, rectangleRef, selectedBox, handleBoxClick
}) => (
  <div className="dashboard-column left-column">
    <div
      className="area-buttons"
      ref={areaButtonsRef}
      onMouseDown={handleMouseDrag}
      onTouchStart={handleMouseDrag}
    >
      {areaButtons.map((area) => (
        <button
          key={area}
          className={`area-button ${selectedArea === area ? "selected" : ""}`}
          onClick={() => setSelectedArea(area)}
        >
          {area}
        </button>
      ))}
    </div>
    <div className="empty-rectangle-wrapper">
      <div className="rectangle-label">{selectedBox || "Empty Rectangle Label"}</div>
      <div className="empty-rectangle" ref={rectangleRef}></div>
    </div>
    <div className="scrollable-boxes">
      {[...Array(8)].map((_, index) => (
        <div
          className="scroll-box-wrapper"
          key={index}
          onClick={() => handleBoxClick(`Label for Box ${index + 1}`)}
        >
          <div className="scroll-box">
            <div className="scroll-box-content"></div>
          </div>
          <div className="scroll-box-label">Label for Box {index + 1}</div>
        </div>
      ))}
    </div>
  </div>
);

const RightColumn = ({ detectedInfoData }) => (
  <div className="dashboard-column right-column">
    <div className="detected-today">
      <h4>Terdeteksi hari ini</h4>
      <a href="/report" className="chevron-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="chevron-icon">
          <path fill="currentColor" d="M8.7 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4L13.59 12L8.7 7.41a1 1 0 0 1 0-1.41Z" />
        </svg>
      </a>
    </div>
    {detectedInfoData.map((info, index) => (
      <div className="detected-info-row" key={index}>
        <div className="detected-details">
          <div className="detected-date">{info.date}</div>
          <div className="detected-message">{info.message}</div>
          <div className="detected-student">{info.student}</div>
        </div>
        <div className="detected-photo">
          <div className="photo-placeholder"></div>
        </div>
      </div>
    ))}
  </div>
);

export default DashboardPage;