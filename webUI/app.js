// I sleep now
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toggleSelection(element) {
  element.classList.toggle("selected");
  const checkbox = element.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  if (checkbox.checked) {
    console.log(`Selected ${element.dataset.name}`);
  } else {
    console.log(`Unselected ${element.dataset.name}`);
  }
  var selectedTweaks = [];
  const tweakElements = document.querySelectorAll(".tweak.selected");
  tweakElements.forEach((tweak) => {
    const labelElement = tweak.querySelector(".tweak-info .tweak-title");
    selectedTweaks.push("**" + tweak.dataset.category);
    selectedTweaks.push(labelElement.textContent);
  });
  selectedTweaks = [...new Set(selectedTweaks)];
  document.getElementById("selected-tweaks").innerHTML = ""; // Clear the container
  selectedTweaks.forEach((tweak) => {
    const tweakItem = document.createElement("div");
    if (tweak.includes("**")) {
      // tweakItem.className = ("tweakListCategory")
      var label = document.createElement("label");
      tweak = tweak.substring(2);
      label.textContent = tweak;
      label.className = "tweak-list-category";
      tweakItem.append(label);
    } else {
      tweakItem.className = "tweak-list-pack";
      tweakItem.textContent = tweak;
    }
    document.getElementById("selected-tweaks").appendChild(tweakItem);
  });
  if (selectedTweaks.length == 0) {
    const tweakItem = document.createElement("div");
    tweakItem.className = "tweak-list-pack";
    tweakItem.textContent = "Select some packs and see them appear here!";
    document.getElementById("selected-tweaks").appendChild(tweakItem);
  }
  // query params
  var st = getSelectedTweaks();
  for (var key in st) {
    try {
      if (st[key].packs) {
        // remove categories
        delete st[key];
      }
    } catch (e) {
      // keep raw
    }
  }
  const params = new URLSearchParams(window.location.search);
  let newUrl;
  // remove st raw if empty
  if (st["raw"].length == 0) {
    params.delete("st_raw");
    newUrl = `${window.location.pathname}`;
  } else {
    const stcomp = LZString.compressToEncodedURIComponent(
      JSON.stringify(st),
    );
    params.set("st_raw", stcomp);
    newUrl = `${window.location.pathname}?${params.toString()}`;
  }
  // update url
  window.history.replaceState({}, "", newUrl);
}

const loadedparams = new URLSearchParams(window.location.search);
if (loadedparams.has("st_raw")) {
  const st = JSON.parse(
    LZString.decompressFromEncodedURIComponent(loadedparams.get("st_raw")),
  );
  processJsonData(st);
}

window.addEventListener("resize", () => {
  if (window.matchMedia("(max-width: 767px)").matches) {
    document.getElementById("selected-tweaks").style.display = "none";
  } else {
    document.getElementById("selected-tweaks").style.display = "block";
  }
});

const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function getTimeoutDuration() {
  return mediaQuery.matches ? 0 : 487.5;
}

function toggleCategory(label) {
  const tweaksContainer = label.nextElementSibling;
  const timeoutDuration = getTimeoutDuration();

  if (tweaksContainer.style.maxHeight) {
    tweaksContainer.style.maxHeight = null;
    setTimeout(() => {
      tweaksContainer.style.display = "none";
      tweaksContainer.style.paddingTop = null;
      tweaksContainer.style.paddingBottom = null;
      label.classList.toggle("open");
    }, timeoutDuration); // Matches the transition duration
  } else {
    tweaksContainer.style.display = "block";
    tweaksContainer.style.paddingTop = "7.5px";
    tweaksContainer.style.paddingBottom = "7.5px";
    label.classList.toggle("open");
    tweaksContainer.style.maxHeight = tweaksContainer.scrollHeight + "px";
    const outerCatLabel =
      label.parentElement.parentElement.previousElementSibling;
    const outerCatContainer = label.parentElement.parentElement;
    if (outerCatLabel.classList.contains("category-label")) {
      outerCatContainer.style.maxHeight =
        outerCatContainer.scrollHeight + tweaksContainer.scrollHeight + "px";
    }
  }
}

function downloadSelectedTweaks() {
  var mcVersion = document.getElementById("mev").value;
  console.log(`Minimum Engine Version is set to ${mcVersion}`);
  var packName = document.getElementById("fileNameInput").value;
  if (!packName) {
    packName = `BTRP-${String(Math.floor(Math.random() * 1000000)).padStart(
      6,
      "0",
    )}`;
  }
  console.log(`Pack Name is set to ${packName}`);
  packName = packName.replaceAll("/", "-");
  jsonData = getSelectedTweaks();
  fetchPack("https", jsonData, packName, mcVersion);
}
const serverip = "localhost";

function fetchPack(protocol, jsonData, packName, mcVersion) {
  var downloadbutton = document.getElementsByClassName(
    "download-selected-button",
  )[0];
  // For people that spam the download button
  downloadbutton.onclick = null;
  // Change between border animations
  if (protocol === "http") {
    downloadbutton.classList.remove("s");
    downloadbutton.innerText = "Retrying with HTTP...";
  } else {
    downloadbutton.classList.add("http");
    downloadbutton.classList.add("s");
    downloadbutton.innerText = "Fetching Pack...";
  }

  console.log("Fetching pack...");
  fetch(`${protocol}://${serverip}/exportResourcePack`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      packName: packName,
      mcVersion: mcVersion,
    },
    body: JSON.stringify(jsonData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.blob();
    })
    .then(async (blob) => {
      console.log("Received pack!");
      // Just exists lol, it doesnt change for some reason
      downloadbutton.innerText = "Obtained pack!";
      downloadbutton.classList.remove("http");
      // When using https, remove the s class
      if (downloadbutton.classList.contains("s")) {
        downloadbutton.classList.remove("s");
      }
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${packName}.mcpack`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      await sleep(1000);
      downloadbutton.innerText = "Download Selected Tweaks";
      downloadbutton.onclick = downloadSelectedTweaks;
    })
    .catch(async (error) => {
      if (protocol === "https") {
        console.error("HTTPS error, trying HTTP:", error);
        fetchPack("http", jsonData, packName, mcVersion); // Retry with HTTP
      } else {
        console.error("Error:", error);
        downloadbutton.classList.remove("http");
        downloadbutton.innerText =
          "Couldn't fetch pack. Check console for error log.";
        downloadbutton.classList.add("error");
        await sleep(3000);
        downloadbutton.classList.remove("error");
        downloadbutton.innerText = "Download Selected Tweaks";
        downloadbutton.onclick = downloadSelectedTweaks;
      }
    });
}

function processJsonData(jsonData) {
  const rawPacks = jsonData.raw;

  if (Array.isArray(rawPacks)) {
    rawPacks.forEach(function (pack) {
      const div = document.querySelector(`div.tweak[data-name="${pack}"]`);
      if (div) {
        toggleSelection(div);
        console.log(`Toggled Selection of ${pack}`);
      } else {
        console.error(`Div with data-name="${pack}" not found.`);
      }
    });
  } else {
    console.error("The 'raw' field in selected_packs.json is not an array.");
  }
}


function getSelectedTweaks() {
  const selectedTweaks = [];
  const tweakElements = document.querySelectorAll(".tweak.selected");
  tweakElements.forEach((tweak) => {
    selectedTweaks.push({
      category: tweak.dataset.category,
      name: tweak.dataset.name,
      index: parseInt(tweak.dataset.index),
    });
  });

  const tweaksByCategory = {
    "3D": [],
    Aesthetic: [],
    Crosshairs: [],
    "Colorful Slime": [],
    Elytra: [],
    "Fixes and Consistency": [],
    Fun: [],
    GUI: [],
    Hearts: [],
    "Hotbar Selector": [],
    "Hunger Bars": [],
    "LGBTQ+ Pride": [],
    "Lower and Sides": [],
    "Menu Panoramas": [],
    Mobs: [],
    "More Zombies": [],
    Parity: [],
    "Peace and Quiet": [],
    Retro: [],
    Terrain: [],
    Unobtrusive: [],
    Utility: [],
    Variation: [],
    "World of Color": [],
    "Xisuma's Hermitcraft Bases": [],
  };

  const indicesByCategory = {
    "3D": [],
    Aesthetic: [],
    Crosshairs: [],
    "Colorful Slime": [],
    Elytra: [],
    "Fixes and Consistency": [],
    Fun: [],
    GUI: [],
    Hearts: [],
    "Hotbar Selector": [],
    "Hunger Bars": [],
    "LGBTQ+ Pride": [],
    "Lower and Sides": [],
    "Menu Panoramas": [],
    Mobs: [],
    "More Zombies": [],
    Parity: [],
    "Peace and Quiet": [],
    Retro: [],
    Terrain: [],
    Unobtrusive: [],
    Utility: [],
    Variation: [],
    "World of Color": [],
    "Xisuma's Hermitcraft Bases": [],
  };
  console.log("Obtaining selected tweaks...");
  selectedTweaks.forEach((tweak) => {
    tweaksByCategory[tweak.category].push(tweak.name);
    indicesByCategory[tweak.category].push(tweak.index);
  });
  console.log("Obtained!");
  const jsonData = {
    "3D": {
      packs: tweaksByCategory["3D"],
      index: indicesByCategory["3D"],
    },
    Aesthetic: {
      packs: tweaksByCategory["Aesthetic"],
      index: indicesByCategory["Aesthetic"],
    },
    Crosshairs: {
      packs: tweaksByCategory["Crosshairs"],
      index: indicesByCategory["Crosshairs"],
    },
    "Colorful Slime": {
      packs: tweaksByCategory["Colorful Slime"],
      index: indicesByCategory["Colorful Slime"],
    },
    Elytra: {
      packs: tweaksByCategory["Elytra"],
      index: indicesByCategory["Elytra"],
    },
    "Fixes and Consistency": {
      packs: tweaksByCategory["Fixes and Consistency"],
      index: indicesByCategory["Fixes and Consistency"],
    },
    Fun: {
      packs: tweaksByCategory["Fun"],
      index: indicesByCategory["Fun"],
    },
    GUI: {
      packs: tweaksByCategory["GUI"],
      index: indicesByCategory["GUI"],
    },
    Hearts: {
      packs: tweaksByCategory["Hearts"],
      index: indicesByCategory["Hearts"],
    },
    "Hotbar Selector": {
      packs: tweaksByCategory["Hotbar Selector"],
      index: indicesByCategory["Hotbar Selector"],
    },
    "Hunger Bars": {
      packs: tweaksByCategory["Hunger Bars"],
      index: indicesByCategory["Hunger Bars"],
    },
    "LGBTQ+ Pride": {
      packs: tweaksByCategory["LGBTQ+ Pride"],
      index: indicesByCategory["LGBTQ+ Pride"],
    },
    "Lower and Sides": {
      packs: tweaksByCategory["Lower and Sides"],
      index: indicesByCategory["Lower and Sides"],
    },
    "Menu Panoramas": {
      packs: tweaksByCategory["Menu Panoramas"],
      index: indicesByCategory["Menu Panoramas"],
    },
    Mobs: {
      packs: tweaksByCategory["Mobs"],
      index: indicesByCategory["Mobs"],
    },
    "More Zombies": {
      packs: tweaksByCategory["More Zombies"],
      index: indicesByCategory["More Zombies"],
    },
    Parity: {
      packs: tweaksByCategory["Parity"],
      index: indicesByCategory["Parity"],
    },
    "Peace and Quiet": {
      packs: tweaksByCategory["Peace and Quiet"],
      index: indicesByCategory["Peace and Quiet"],
    },
    Retro: {
      packs: tweaksByCategory["Retro"],
      index: indicesByCategory["Retro"],
    },
    Terrain: {
      packs: tweaksByCategory["Terrain"],
      index: indicesByCategory["Terrain"],
    },
    Unobtrusive: {
      packs: tweaksByCategory["Unobtrusive"],
      index: indicesByCategory["Unobtrusive"],
    },
    Utility: {
      packs: tweaksByCategory["Utility"],
      index: indicesByCategory["Utility"],
    },
    Variation: {
      packs: tweaksByCategory["Variation"],
      index: indicesByCategory["Variation"],
    },
    "World of Color": {
      packs: tweaksByCategory["World of Color"],
      index: indicesByCategory["World of Color"],
    },
    "Xisuma's Hermitcraft Bases": {
      packs: tweaksByCategory["Xisuma's Hermitcraft Bases"],
      index: indicesByCategory["Xisuma's Hermitcraft Bases"],
    },
    raw: selectedTweaks.map((tweak) => tweak.name),
  };
  return jsonData;
}

// Extra code to trigger file input
document
  .querySelector(".zipinputcontainer")
  .addEventListener("click", function () {
    document.getElementById("zipInput").click();
  });

document
  .getElementById("zipInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        JSZip.loadAsync(e.target.result)
          .then(function (zip) {
            let fileFound = false;

            zip.forEach(function (relativePath, zipEntry) {
              if (relativePath.endsWith("selected_packs.json")) {
                fileFound = true;
                zipEntry
                  .async("string")
                  .then(function (content) {
                    try {
                      const jsonData = JSON.parse(content);
                      processJsonData(jsonData);
                    } catch (error) {
                      console.error("Error parsing JSON:", error);
                    }
                  })
                  .catch(function (error) {
                    console.error(
                      "Error extracting selected_packs.json:",
                      error,
                    );
                  });
              }
            });

            if (!fileFound) {
              console.error(
                "selected_packs.json not found in any folder within the ZIP file.",
              );
            }
          })
          .catch(function (error) {
            console.error("Error reading the ZIP file:", error);
          });
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error("No file selected.");
    }
  });
