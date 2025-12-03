document.addEventListener("DOMContentLoaded", function () {
  // Download Dialog Functionality
  const downloadButton = document.querySelector(".cta-button");
  const downloadDialog = document.querySelector(".download-dialog");
  const closeDialogButton = document.querySelector(".close-dialog");

  downloadButton.addEventListener("click", (e) => {
    e.preventDefault();
    downloadDialog.classList.add("active");
  });

  closeDialogButton.addEventListener("click", () => {
    downloadDialog.classList.remove("active");
  });

  // Close dialog when clicking outside
  downloadDialog.addEventListener("click", (e) => {
    if (e.target === downloadDialog) {
      downloadDialog.classList.remove("active");
    }
  });

  const svg = document.querySelector(".flow-lines");
  const steps = document.querySelectorAll(".flow-step");
  const flowContainer = document.querySelector(".mechanics-flow");
  const mechanicsSection = document.querySelector(".mechanics");

  if (!svg || steps.length === 0 || !flowContainer || !mechanicsSection) {
    console.error("Required elements for flow diagram not found.");
    return;
  }

  // Create an intersection observer to detect when the mechanics section is visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          svg.classList.add("animate-lines");
          // Once animation is triggered, we can stop observing
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  ); // Start animation when 20% of the section is visible

  observer.observe(mechanicsSection);

  function isDesktop() {
    return window.innerWidth >= 768;
  }

  function getCenter(element) {
    // Gets the center coordinates of an element relative to its container
    const rect = element.getBoundingClientRect();
    const containerRect = flowContainer.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
    };
  }

  function drawLines() {
    // Clear previous lines
    svg.innerHTML = "";

    // Determine number of connections based on viewport
    const numberOfSteps = isDesktop() ? steps.length : steps.length - 1;

    // Draw lines between steps
    for (let i = 0; i < numberOfSteps; i++) {
      const startStep = steps[i];
      const endStep = steps[(i + 1) % steps.length]; // Modulo only affects desktop layout

      const start = getCenter(startStep);
      const end = getCenter(endStep);

      // Calculate a control point to make the line curve outwards
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // This creates the "loopy" effect by finding a perpendicular offset
      const normalX = -dy;
      const normalY = dx;
      const normalLength = Math.sqrt(normalX * normalX + normalY * normalY);
      const unitNormalX = normalLength > 0 ? normalX / normalLength : 0;
      const unitNormalY = normalLength > 0 ? normalY / normalLength : 0;

      // The 'loopiness' factor determines how much the line curves
      const loopiness = distance * 0.4;
      const controlX = (start.x + end.x) / 2 + unitNormalX * loopiness;
      const controlY = (start.y + end.y) / 2 + unitNormalY * loopiness;

      // Create the SVG path element
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      // M = Move to, Q = Quadratic Bezier Curve to
      path.setAttribute(
        "d",
        `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
      );
      path.setAttribute("stroke", "#BDBDBD");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-dasharray", "5, 5");
      path.setAttribute("fill", "none");
      path.setAttribute("pathLength", "100"); // For more precise animation control

      svg.appendChild(path);
    }
  }

  // A small timeout ensures all elements are rendered before we calculate their positions
  setTimeout(drawLines, 100);

  // Redraw lines on window resize to keep it responsive
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(drawLines, 200);
  });

  // 3D Mouse tracking effect for phone mockup
  const phoneMockup = document.querySelector(".phone-mockup");
  const phoneImg = phoneMockup.querySelector("img");

  // Only enable this effect on devices with fine pointers (mice), not touch screens
  if (window.matchMedia("(pointer: fine)").matches) {
    let rect = phoneMockup.getBoundingClientRect();
    let mouseX = 0;
    let mouseY = 0;
    let centerX = rect.left + rect.width / 2;
    let centerY = rect.top + rect.height / 2;
    let animationFrameId = null;

    function updateMousePosition(e) {
      mouseX = e.clientX - centerX;
      mouseY = e.clientY - centerY;
    }

    function updateTransform() {
      if (!phoneMockup.classList.contains("hovering")) {
        animationFrameId = null;
        return;
      }

      // Convert mouse position to rotation angles
      const rotateY = (mouseX / centerX) * 15; // max 15 degrees
      const rotateX = -(mouseY / centerY) * 10; // max 10 degrees

      // Apply transform
      const targetTransform = `translateZ(50px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${
        window.innerWidth >= 768 ? 1.08 : 1.05
      })`;
      phoneImg.style.transform = targetTransform;

      animationFrameId = requestAnimationFrame(updateTransform);
    }

    function startTracking(e) {
      rect = phoneMockup.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      phoneMockup.classList.add("hovering");
      updateMousePosition(e); // Get initial position
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updateTransform);
      }
    }

    function stopTracking() {
      phoneMockup.classList.remove("hovering");
      phoneImg.style.transform = "rotateY(0) rotateX(0) scale(1)";
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }

    phoneMockup.addEventListener("mouseenter", startTracking);
    phoneMockup.addEventListener("mouseleave", stopTracking);
    phoneMockup.addEventListener("mousemove", updateMousePosition);

    // Update center point on resize
    window.addEventListener("resize", () => {
      rect = phoneMockup.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    });
  }

  // --- Neural Mesh Animation ---
  const canvas = document.getElementById("neural-mesh-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width, height, centerX, centerY, baseRadius;
    let animationFrameId = null;
    let isVisible = false;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;

      // Set canvas size accounting for device pixel ratio
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Scale the canvas context
      ctx.scale(dpr, dpr);

      // Set canvas CSS size
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      centerX = width / 2;
      centerY = height / 2;
      baseRadius = Math.min(width, height) / 2;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class APoint3D {
      constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.offsetPhase = Math.random() * 2 * Math.PI;
      }
    }

    class ANode {
      constructor(basePosition) {
        this.basePosition = basePosition;
      }
    }

    class AEdge {
      constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
      }
    }

    const createAsymmetricalNodesAndEdges = () => {
      // Use fewer nodes on smaller screens for better performance
      const numNodes = window.innerWidth < 768 ? 30 : 50;
      const nodes = [];
      const edges = [];

      for (let i = 0; i < numNodes; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.pow(Math.random(), 0.5);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        nodes.push(new ANode(new APoint3D(x, y, z)));
      }

      for (let i = 0; i < numNodes; i++) {
        const neighbors = Array.from({ length: numNodes }, (_, j) => j)
          .filter((j) => i !== j)
          .sort((a, b) => {
            const p1 = nodes[i].basePosition;
            const p2 = nodes[a].basePosition;
            const p3 = nodes[b].basePosition;
            const distA = Math.sqrt(
              Math.pow(p1.x - p2.x, 2) +
                Math.pow(p1.y - p2.y, 2) +
                Math.pow(p1.z - p2.z, 2)
            );
            const distB = Math.sqrt(
              Math.pow(p1.x - p3.x, 2) +
                Math.pow(p1.y - p3.y, 2) +
                Math.pow(p1.z - p3.z, 2)
            );
            return distA - distB;
          })
          .slice(0, 3);

        neighbors.forEach((j) => {
          if (i < j) {
            edges.push(new AEdge(i, j));
          }
        });
      }
      return { nodes, edges };
    };

    const { nodes, edges } = createAsymmetricalNodesAndEdges();

    const projectPoint = (point) => {
      const perspective = 300;
      const scale = perspective / (perspective + point.z + 100);
      const projectedX = point.x * scale + centerX;
      const projectedY = point.y * scale + centerY;
      return { x: projectedX, y: projectedY, scale };
    };

    const drawNodes = (projectedNodes) => {
      projectedNodes.forEach(({ x, y, scale }) => {
        const radius = 5 * scale;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#212121";
        ctx.fill();

        // Add subtle glow effect
        ctx.shadowColor = "rgba(33, 33, 33, 0.3)";
        ctx.shadowBlur = 5;
      });
    };

    const drawConnections = (projectedNodes, edges) => {
      edges.forEach((edge) => {
        const p1 = projectedNodes[edge.node1];
        const p2 = projectedNodes[edge.node2];
        const scale1 = p1.scale;
        const scale2 = p2.scale;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = "#212121";
        ctx.lineWidth = 1.5 * ((scale1 + scale2) / 2);
        ctx.stroke();
      });
    };

    let angleY = 0;
    let angleX = 0;
    let pulse = 1;
    let nodeMovement = 0;
    let lastTime = 0;

    const animate = (time) => {
      if (!isVisible) return; // Stop animation if not visible

      const deltaTime = time - lastTime;
      lastTime = time;

      angleY += ((2 * Math.PI) / 20000) * deltaTime;
      angleX += ((2 * Math.PI) / 25000) * deltaTime;
      pulse = 0.9 + ((Math.sin((time / 1500) * Math.PI) + 1) / 2) * 0.2;
      nodeMovement = (Math.sin((time / 5000) * Math.PI) + 1) / 2;

      // Clear with proper device pixel ratio
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const transformedNodes = nodes.map((node) => {
        const pulsatingRadius = baseRadius * pulse;
        const offset =
          Math.sin(node.basePosition.offsetPhase + nodeMovement * 2 * Math.PI) *
          0.1;
        let { x, y, z } = node.basePosition;
        x *= 1 + offset;
        y *= 1 + offset;
        z *= 1 + offset;

        const rotatedX_Y = x * Math.cos(angleY) + z * Math.sin(angleY);
        const rotatedZ_Y = -x * Math.sin(angleY) + z * Math.cos(angleY);

        const finalY = y * Math.cos(angleX) - rotatedZ_Y * Math.sin(angleX);
        const finalZ = y * Math.sin(angleX) + rotatedZ_Y * Math.cos(angleX);

        const transformedPoint = new APoint3D(
          rotatedX_Y * pulsatingRadius,
          finalY * pulsatingRadius,
          finalZ * pulsatingRadius
        );
        return projectPoint(transformedPoint);
      });

      // Enable antialiasing for smoother lines
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      drawConnections(transformedNodes, edges);
      drawNodes(transformedNodes);

      animationFrameId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!animationFrameId) {
        lastTime = performance.now(); // Reset time to avoid a jump in animation
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const stopAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    // Use Intersection Observer to only animate when the canvas is visible
    const animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible = true;
            startAnimation();
          } else {
            isVisible = false;
            stopAnimation();
          }
        });
      },
      { threshold: 0.1 }
    ); // Start when 10% is visible

    animationObserver.observe(canvas);
  }

  // Typewriter effect for system dialog
  const systemDialog = document.getElementById("system-dialog");
  const dialogText = `Hi, I am The System - an advanced AI designed to optimize your daily routines and enhance your productivity.\n\nMy primary objective is to help you overcome digital distractions and procrastination through strategic gamification of your daily tasks.\n\nBy analyzing your patterns and implementing reward-based mechanisms, I create a personalized system that transforms mundane tasks into engaging challenges.`;

  let charIndex = 0;
  let isDialogVisible = false;

  const typeWriter = () => {
    if (charIndex < dialogText.length) {
      if (dialogText.charAt(charIndex) === "\n") {
        systemDialog.innerHTML += "<br><br>";
      } else {
        systemDialog.innerHTML += dialogText.charAt(charIndex);
      }
      charIndex++;
      const randomDelay = Math.random() * 15; // Random delay between 20-50ms
      setTimeout(typeWriter, randomDelay);
    }
  };

  // Start typewriter when section becomes visible
  const dialogObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isDialogVisible) {
          isDialogVisible = true;
          setTimeout(typeWriter, 500); // Start typing after a short delay
          dialogObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  if (systemDialog) {
    dialogObserver.observe(systemDialog);
  }

  // Slider Functionality
  function initializeSlider() {
    const slider = document.querySelector(".quests-slider");
    const slides = document.querySelectorAll(".quest-slide");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");
    let currentSlide = 0;

    function updateSlides() {
      slides.forEach((slide, index) => {
        slide.classList.remove("active");
        if (index === currentSlide) {
          slide.classList.add("active");
        }
      });
      slider.style.transform = `translateX(-${currentSlide * 100}%)`;

      // Redraw flow lines for the current slide
      const currentSvg = slides[currentSlide].querySelector(".flow-lines");
      if (currentSvg) {
        currentSvg.classList.remove("animate-lines");
        setTimeout(() => {
          currentSvg.classList.add("animate-lines");
        }, 50);
      }
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      updateSlides();
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      updateSlides();
    }

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    slider.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) {
        nextSlide();
      } else if (touchEndX - touchStartX > 50) {
        prevSlide();
      }
    });

    // Button click handlers
    if (prevBtn) prevBtn.addEventListener("click", prevSlide);
    if (nextBtn) nextBtn.addEventListener("click", nextSlide);

    // Keyboard support
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    });
  }

  initializeSlider();

  // Quest Slider Data
  const quests = [
    {
      title: "Touch Grass Everyday",
      steps: [
        "Distractive apps remain locked",
        "Go out and touch grass",
        "Snap a pic ",
        "AI checks pics",
        "Unlock apps for a while",
      ],
    },
    {
      title: "Run 3km everyday",
      steps: [
        "Distractive apps remain locked",
        "You run 3km",
        "QP connects to your device sensors",
        "Checks if quest completed",
        "Unlock apps for a while",
      ],
    },
    {
      title: "Study for 25 minutes",
      steps: [
        "Distractive apps remain locked",
        "Start quest",
        "Non-study apps stay locked",
        "get coins after 25 minutes",
        "Unlock apps for a while",
      ],
    },
    {
      title: "Pomodoro",
      steps: [
        "Distractive apps remain locked",
        "Start quest",
        "Pomodoro Starts",
        "get coins every cycle",
        "Unlock apps for a while",
      ],
    },
    {
      title: "Burn 7700 kcal",
      steps: [
        "Distractive apps remain locked",
        "Perform Exercises",
        "QP connects to your device sensors",
        "verification happens",
        "get coins",
      ],
    },
    {
      title: "Go Gym",
      steps: [
        "Distractive apps remain locked",
        "Visit Gym",
        "Snap a pic",
        "Ai verifies the pics",
        "get coins",
      ],
    },
    {
      title: "Drawing",
      steps: [
        "Distractive apps remain locked",
        "Draw",
        "Snap a pic",
        "Ai verifies",
        "Unlock apps for a while",
      ],
    },
  ];

  function initializeSlider() {
    let currentQuest = 0;
    const questTitle = document.getElementById("quest-title");
    const steps = document.querySelectorAll(".flow-step");
    const questContent = document.querySelector(".quest-content");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");
    const svg = document.querySelector(".flow-lines");

    function updateQuest() {
      questContent.style.opacity = "0";
      setTimeout(() => {
        const quest = quests[currentQuest];
        questTitle.textContent = `${quest.title}`;
        steps.forEach((step, index) => {
          step.textContent = quest.steps[index];
        });
        questContent.style.opacity = "1";

        // Restart flow lines animation
        svg.classList.remove("animate-lines");
        setTimeout(() => svg.classList.add("animate-lines"), 50);
      }, 300);
    }

    function nextQuest() {
      currentQuest = (currentQuest + 1) % quests.length;
      updateQuest();
    }

    function prevQuest() {
      currentQuest = (currentQuest - 1 + quests.length) % quests.length;
      updateQuest();
    }

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    document
      .querySelector(".slider-container")
      .addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
      });

    document
      .querySelector(".slider-container")
      .addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
          nextQuest();
        } else if (touchEndX - touchStartX > 50) {
          prevQuest();
        }
      });

    // Button click handlers
    prevBtn.addEventListener("click", prevQuest);
    nextBtn.addEventListener("click", nextQuest);

    // Keyboard support
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") prevQuest();
      if (e.key === "ArrowRight") nextQuest();
    });
  }

  initializeSlider();

  // Screenshots Data
  const screenshots = [
    {
      title: "Custom Themes",
      type: "image",
      image: "assets/screenshots/sakura.png",
      description:
        "btw the sakura tree here grows together with your streak. if you break the streak, it will wither and die :(",
    },
    {
      title: "Ai Snap",
      type: "video",
      url: "assets/screenshots/early_wake.mp4",
      description:
        "This quest requires you to wake up early and snap a pic of the morning sky. AI verifies the pic to ensure authenticity.",
    },
    {
      title: "Deep Focus",
      type: "image",
      image: "assets/screenshots/deep_focus.gif",
      description:
        "Block access to your entire device except selected apps until quest over  (sped up video)",
    },
    {
      title: "Health Quest",
      type: "image",
      image: "assets/screenshots/steps_quest.png",
      description:
        "QP uses your device's health data to verify tasks like steps, distance covered, calorie burned, sleep and hydration.",
    },
    {
      title: "Hacker Theme",
      type: "image",
      image: "assets/screenshots/hacker.gif",
      description: "matrix ahh animation",
    },
    {
      title: "Cool Animations",
      type: "image",
      image: "assets/screenshots/streak.gif",
      description: "fire",
    },
    {
      title: "Templates",
      type: "image",
      image: "assets/screenshots/templates.png",
      description: "Quickly add quests using pre-made templates",
    },
    {
      title: "Personalized Notifications",
      type: "image",
      image: "assets/screenshots/reminders.png",
      description:
        "Get personalized notifications from our on device AI assistant to keep you motivated",
    },
    {
      title: "Markdown Support",
      type: "video",
      url: "assets/screenshots/md_editor.mp4",
      description:
        "Write rich text descriptions for your quests using markdown",
    },
  ];

  // Screenshots Slider
  function initializeScreenshotsSlider() {
    const screenshotTitle = document.getElementById("screenshot-title");
    const screenshotImage = document.getElementById("screenshot-image");
    const screenshotVideo = document.getElementById("screenshot-video");
    const screenshotDescription = document.getElementById(
      "screenshot-description"
    );
    const screenshotItem = document.querySelector(".screenshot-item");
    const prevBtn = document.querySelector(".screenshots-slider .prev-btn");
    const nextBtn = document.querySelector(".screenshots-slider .next-btn");
    let currentScreenshot = 0;

    function updateScreenshots() {
      screenshotItem.style.opacity = "0";
      const screenshot = screenshots[currentScreenshot];
      screenshotTitle.textContent = screenshot.title;

      // Handle both video and image content
      if (screenshot.type === "video") {
        screenshotImage.style.display = "none";
        screenshotVideo.style.display = "block";
        screenshotVideo.src = screenshot.url;
        if (screenshot.poster) {
          screenshotVideo.poster = screenshot.poster;
        }
      } else {
        screenshotImage.style.display = "block";
        screenshotVideo.style.display = "none";
        screenshotImage.src = screenshot.image;
      }

      screenshotDescription.textContent = screenshot.description;
      screenshotItem.style.opacity = "1";
    }

    function nextScreenshot() {
      currentScreenshot = (currentScreenshot + 1) % screenshots.length;
      updateScreenshots();
    }

    function prevScreenshot() {
      currentScreenshot =
        (currentScreenshot - 1 + screenshots.length) % screenshots.length;
      updateScreenshots();
    }

    // Touch support for screenshots
    let touchStartX = 0;
    let touchEndX = 0;

    document
      .querySelector(".screenshots-content")
      .addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
      });

    document
      .querySelector(".screenshots-content")
      .addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
          nextScreenshot();
        } else if (touchEndX - touchStartX > 50) {
          prevScreenshot();
        }
      });

    // Button click handlers
    if (prevBtn) prevBtn.addEventListener("click", prevScreenshot);
    if (nextBtn) nextBtn.addEventListener("click", nextScreenshot);
  }

  // Initialize both sliders
  initializeSlider();
  initializeScreenshotsSlider();
});
