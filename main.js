
const unitDrop = document.getElementById('unitdrop');
const unitbtn = document.getElementById('unitbtn')
unitbtn.addEventListener('click', function () {
    
    if(unitDrop.classList.contains('show')) {
        unitDrop.classList.remove('show');
    } else {
        unitDrop.classList.add('show');
        unitbtn.style.border = '2px'
    }
});

// add eventlistener to the parent element 
unitDrop.addEventListener('change', (e) => {
    // Check if the changed element is a radio input
    if (e.target.type === 'radio') {
        const radioName = e.target.name; // Get the name attribute (temp, wind, or precip)
   
        // Remove class only from labels within the same radio group
        document.querySelectorAll(`input[name="${radioName}"]`).forEach(r => {
            r.parentElement.classList.remove("boxcolor");
        });
        
        // Add class to the selected radio's label
        if (e.target.checked) {
            const name = e.target.id
            console.log(name)
            e.target.parentElement.classList.add("boxcolor");
        }
    }
});


//days selection 
const selected = document.querySelector('.select-selected');
const items = document.querySelector('.select-items');

selected.addEventListener('click', () => {
    items.classList.toggle('select-hide');
});

items.querySelectorAll('div').forEach(item => {
    item.addEventListener('click', () => {
        selected.textContent = item.textContent;
        items.classList.add('select-hide');
    });
});

const date = document.getElementById('date');
const country= document.getElementById('country');


const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul','Aug', 'Sept', 'Oct', 'Nov', 'Dec']
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday']
let dateObj = new Date();
let month = months[dateObj.getMonth()];
let day = dateObj.getDate();
let weekday = weekdays[dateObj.getDay()]
let year = dateObj.getFullYear();

date.innerHTML = `${weekday}, ${day} ${month}, ${year}`





// Populate dropdown with actual dates from API
const populateDayDropdown = (data) => {
    const selectItems = document.querySelector('.select-items');
    const selectSelected = document.querySelector('.select-selected');
    
    // Clear existing items
    selectItems.innerHTML = '';
    
    // Add items for each day from the API
    data.daily.time.forEach((dateString, index) => {
        const div = document.createElement('div');
        div.setAttribute('data-index', index);
        
        // Get dynamic day name based on actual date
        const dayName = getDayName(dateString, index);
        div.textContent = dayName;
        
        // Click event for each item
        div.addEventListener('click', () => {
            selectSelected.textContent = div.textContent;
            selectSelected.setAttribute('data-index', index);
            selectItems.classList.add('select-hide');
            
            console.log('Selected day:', div.textContent, 'Index:', index);
            
            //  Update hourly forecast for selected day
            displayHourlyForecast(data, index);
            
            // Optional: Show day details
    
            showDayDetails(data, index);
        });
        selectItems.appendChild(div);
    });
    
    // Set default to "Today"
    selectSelected.textContent = getDayName(data.daily.time[0], 0);
    selectSelected.setAttribute('data-index', 0);
};

// Show detailed forecast for selected day
const showDayDetails = (data, index) => {
    console.log('Day Details:');
    console.log('Date:', data.daily.time[index]);
    console.log('Max Temp:', data.daily.temperature_2m_max[index]);
    console.log('Min Temp:', data.daily.temperature_2m_min[index]);
    console.log('Weather Code:', data.daily.weather_code[index]);
    console.log('Precipitation:', data.daily.precipitation_sum[index]);
    
    // You can update your UI here to show these details
};



// Initial weather fetch
main();

// Auto-refresh weather every 10 minutes (600,000 ms)
setInterval(() => {
    const savedLat = localStorage.getItem('selected_lat');
    const savedLon = localStorage.getItem('selected_lon');
    
    if (savedLat && savedLon) {
        getWeather(parseFloat(savedLat), parseFloat(savedLon));
        console.log("Weather data auto-refreshed");
    }
}, 600000); // 10 minutes


const getWeather = async (lat, lon) => {

    if (!lat || !lon) {
        console.error("Latitude or longitude missing:", lat, lon);
        return;
    }

    try {
        // ✅ FIXED: Added all required daily parameters
        const weatherDataFetch = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        if (!weatherDataFetch.ok) {
            throw new Error(`HTTP error! status: ${weatherDataFetch.status}`);
        }

        const data = await weatherDataFetch.json();
        console.log('API Data:', data);
        
        displayWeather(data);
        display7DayForecast(data); //  ADDED DAILY: Now calling the function!
        displayHourlyForecast(data)//ADDED HOURLY: Now calling the function!
        populateDayDropdown(data);

   } catch (error) {
    console.error("Error occurred:", error); 
    window.location.href = "/weatherApp/errorpage.html";
}

}



// Add this function to get city name from coordinates
async function getCityName(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await response.json();
        
        const city = data.address.city || 
                     data.address.town || 
                     data.address.village || 
                     data.address.state || 
                     'Unknown Location';
        
        const country = data.address.country || '';
        
        return `${city}, ${country}`;
    } catch (error) {
        console.error('Geocoding error:', error);
        return 'Unknown Location';
    }
}

// Fix the function declaration
async function searchLocation(cityName) {  // ✅ FIXED: async not sync
    try {
        console.log('🔍 Searching for:', cityName);
        
        const countryElement = document.getElementById('country');
        if (countryElement) {
            countryElement.classList = 'searchAnimation'
            countryElement.innerHTML = `
            <div style="
                background: rgba(0,0,0,0.6); 
                padding: 10px; 
                border-radius: 10px; 
                display: inline-flex; 
                align-items: center;
                gap: 8px;
            ">
                    <img src="assets/images/icon-loading.svg" alt="icon" style="width:24px;height:24px;">
                <span style="color:white;">Searching....</span>
            </div>
        `;

        }
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=5`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            console.log('Found locations:', data);
            
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const displayName = data[0].display_name;
            
            console.log('✅ Using location:', displayName);
            console.log('📍 Coordinates:', lat, lon);
            
            if (countryElement) {
                const cityName = data[0].address?.city || 
                                data[0].address?.town || 
                                 data[0].address?.state ||
                                data[0].name ||
                                displayName.split(',')[0];
                countryElement.textContent = cityName;
            }
            
            localStorage.setItem('selected_lat', lat);
            localStorage.setItem('selected_lon', lon);
            localStorage.setItem('selected_location', displayName);
            
            await getWeather(lat, lon);
            
            return { lat, lon, name: displayName };
        } else {
            alert('Location not found. Please try another city name.');
            if (countryElement) {
                countryElement.textContent = 'Location not found';
            }
            return null;
        }
    } catch (error) {
        console.error('❌ Search error:', error);
        alert('Error searching for location. Please try again.');
        return null;
    }
}

async function main(useGPS = false) {
    // Check if user has manually selected a location
    const savedLat = localStorage.getItem('selected_lat');
    const savedLon = localStorage.getItem('selected_lon');
    const savedLocation = localStorage.getItem('selected_location');
    
    // If not forcing GPS and we have a saved location, use it
  if (!useGPS && savedLat && savedLon) {
    console.log('📌 Using saved location:', savedLocation);

    const countryElement = document.getElementById('country');

    // safe guard: ensure savedLocation is a string
    const raw = (savedLocation || '').toString().trim();

    // Prefer: City, State (take first two segments). If only one segment, show that.
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        let display;

        if (parts.length === 0) {
            display = "Saved location";
        }
        else if (parts.length === 1) {
            display = parts[0];
        }
        else if (parts.length === 2) {
            display = `${parts[0]}, ${parts[1]}`;
        }
        else if (parts.length >= 5) {
            display = `${parts[0]}, ${parts[3]}, ${parts[5]}`;
        }
        else if (parts.length >= 3) {
            display = `${parts[0]}, ${parts[2]}`;
        }



    if (countryElement) {
        countryElement.textContent = display;
    }

    // Call getWeather — note: getWeather might update the UI too,
    // so if you want this label to stay, move the UI update *after* getWeather.
    await getWeather(parseFloat(savedLat), parseFloat(savedLon));
    return;
}

    
    // Otherwise try GPS geolocation
    const countryElement = document.getElementById('country');
    if (countryElement) {
        countryElement.classList = 'searchAnimation'
        countryElement.innerHTML = `
        <div style="
            background: rgba(0, 0, 0, 0.32);\
         
            padding: 10px; 
            border-radius: 10px; 
            display: inline-flex; 
            align-items: center;
            gap: 8px;
        ">
            <img src="assets/images/icon-loading.svg" alt="icon" style="width:24px;height:24px;">
            <span style="color:white;">Getting location....</span>
        </div>
            
        `;
    }

    try {
        const position = await getPosition();
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        console.log("📍 GPS coordinates:", lat, lon);

        const location = await getCityName(lat, lon);
        console.log("🏙️ GPS detected:", location.fullName);
        
        // Ask user to confirm if GPS location is correct
        const isCorrect = confirm(
            `GPS detected your location as:\n\n${location.fullName}\n\n` +
            `Is this correct?\n\n` +
            `Click OK if correct, or Cancel to search manually.`
        );
        
        if (isCorrect) {
            if (countryElement) {
                countryElement.textContent = location.city;
            }
            // Save GPS location
            localStorage.setItem('selected_lat', lat);
            localStorage.setItem('selected_lon', lon);
            localStorage.setItem('selected_location', location.fullName);
            await getWeather(lat, lon);
        } else {
            // User rejected GPS, ask for city
            const cityName = prompt("Please enter your city name\n(e.g., Awka, Onitsha, Nnewi):");
            if (cityName) {
                await searchLocation(cityName);
            } else {
                if (countryElement) {
                    countryElement.textContent = 'No location selected';
                }
            }
        }

    } catch (err) {
        console.log("❌ Geolocation Error:", err);
        
        // GPS failed, ask user for city
        
        if (cityName) {
            await searchLocation(cityName);
        } else {
            if (countryElement) {
                countryElement.textContent = 'Location unavailable';
            }
            alert("No location provided. Using default location.");
            await getWeather(6.2104, 7.0670); // Awka, Anambra as default
        }
    }
}


// Fix event listeners
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('searchinput');
const useGpsBtn = document.getElementById('use-gps-btn');

if (searchBtn && cityInput) {
    searchBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // ✅ Prevent form submission
        const cityName = cityInput.value.trim();
        if (cityName) {
            await searchLocation(cityName);
            cityInput.value = '';
        } else {
            alert('Please enter a city name');
        }
    });
    
    cityInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // ✅ Prevent form submission
            const cityName = cityInput.value.trim();
            if (cityName) {
                await searchLocation(cityName);
                cityInput.value = '';
            }
        }
    });
}


main();

// Helper function to get day name
const getDayName = (dateString, index) => {
    if (index === 0) return 'Today';
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday'];
    return days[date.getDay()];
};

// Helper function to get weather icon path
const getWeatherIconPath = (code) => {
    if (code === 0) return 'assets/images/icon-sunny.webp';
    if (code <= 3) return 'assets/images/icon-partly-cloudy.webp';
    if (code <= 48) return 'assets/images/icon-fog.webp';
    if (code <= 57) return 'assets/images/icon-drizzle.webp';
    if (code <= 67) return 'assets/images/icon-rain.webp';
    if (code <= 77) return 'assets/images/icon-snow.webp';
    if (code <= 82) return 'assets/images/icon-rain.webp';
    if (code <= 99) return 'assets/images/icon-storm.webp';
    return 'assets/images/icon-partly-cloudy.webp';
};

// Then your display7DayForecast function here.

const display7DayForecast = (data) => {
    console.log('display7DayForecast called');
    console.log('Data:', data);
    console.log('Daily data:', data.daily);
    
    // Get all forecast cards
    const forecastCards = document.querySelectorAll('.daily_forecast');
    console.log('Found cards:', forecastCards.length);
    
    // Loop through each card and fill with data
    forecastCards.forEach((card, index) => {
        console.log(`Processing card ${index}`);  // Fixed: ( instead of `
        
        if (index < 7 && data.daily.time[index]) {
            console.log(`Day ${index} data:`, {  // Fixed: ( instead of `
                time: data.daily.time[index],
                code: data.daily.weather_code[index],
                max: data.daily.temperature_2m_max[index],
                min: data.daily.temperature_2m_min[index]
            });
            
            // Get elements inside each card
            const dayName = card.querySelector('p:first-child');
            const icon = card.querySelector('img');
            const temps = card.querySelectorAll('.forecast_text p');
            
            console.log('Found elements:', {
                dayName: dayName,
                icon: icon,
                temps: temps.length
            });
            
            // Fill day name
            if (dayName) {
                dayName.textContent = getDayName(data.daily.time[index], index);
                console.log('Set day name:', dayName.textContent);
            }
            
            // Fill icon
            if (icon) {
                icon.src = getWeatherIconPath(data.daily.weather_code[index]);
                icon.alt = `Weather day ${index + 1}`;
                console.log('Set icon:', icon.src);
            }
            
            // Fill temperatures
            if (temps.length >= 2) {
                temps[0].textContent = `${Math.round(data.daily.temperature_2m_max[index])}°`;
                temps[1].textContent = `${Math.round(data.daily.temperature_2m_min[index])}°`;
                console.log('Set temps:', temps[0].textContent, temps[1].textContent);
            }
        }
    });
};

//Helper function to format hour

const formatHour =(dateString, index) => {
    if(index === 0) return "Now";

    const date = new Date(dateString);
    let hours = date.getHours()
    const ampm = hours >= 12 ? "PM" :"AM";
    hours = hours % 12; 
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours} ${ampm}`;
};


//Display  8-hour forecast
const displayHourlyForecast = (data, selectedDayIndex = 0) => {
    console.log('displayHourlyForecast for day index:', selectedDayIndex);

    // Get all hourly forecast cards
    const hourlyCards = document.querySelectorAll('.aside_time');
    console.log('Found hourly cards:', hourlyCards.length);

    // Get the date for the selected day
    const selectedDate = new Date(data.daily.time[selectedDayIndex]);
    
    // Find the starting hour index for the selected day
    let startHourIndex;
    if (selectedDayIndex === 0) {
        // For today, start from current hour
        const now = new Date();
        startHourIndex = data.hourly.time.findIndex(time => {
            const hourTime = new Date(time);
            return hourTime >= now;
        });
    } else {
        // For future days, start from midnight (00:00) of that day
        startHourIndex = data.hourly.time.findIndex(time => {
            const hourTime = new Date(time);
            return hourTime.getDate() === selectedDate.getDate() &&
                   hourTime.getMonth() === selectedDate.getMonth() &&
                   hourTime.getFullYear() === selectedDate.getFullYear();
        });
    }
 
    //Loop through each card (8 hours)
    Array.from(hourlyCards).forEach((card, index) => {
        const dataIndex = startHourIndex + index;

        if(dataIndex < data.hourly.time.length){
            //Get element inside each card
            const hourTime = card.querySelector('.hour-time');
            const icon = card.querySelector('img');
            const temp = card.querySelector('.hour-temp');

            console.log(`Hour ${index}:`, {
                time: data.hourly.time[dataIndex],
                temp:data.hourly.temperature_2m[dataIndex],
                code:data.hourly.weather_code[dataIndex]
            });
            //fill hour time
           if (hourTime) {
                // For today, show "Now" for first hour, otherwise show time
                const isFirstHourOfToday = selectedDayIndex === 0 && index === 0;
                hourTime.textContent = formatHour(
                data.hourly.time[dataIndex],
                isFirstHourOfToday ? 0 : index + 1);
            }

            // Fill icon
            if (icon) {
                icon.src = getWeatherIconPath(data.hourly.weather_code[dataIndex]);
                icon.alt = `Hour ${index}`;
            }

            // Fill temperature
            if (temp) {
                temp.textContent = `${Math.round(data.hourly.temperature_2m[dataIndex])}°`;
            }
        }
    });
};

const displayWeather = (data) => {
    const tempValue = document.getElementById('temp');
    const tempImg = document.getElementById('tempImg');
    const feelLike = document.getElementById('feel');
    const humidity = document.getElementById('humidity');
    const wind = document.getElementById('wind');
    const precipitation = document.getElementById('precipitation');
    
    // Current temperature
    const tempRadios = document.querySelectorAll('input[name="temp"]')

    function updateTemperature () {
        const selected = document.querySelector('input[name="temp"]:checked');
        if(selected.value==='celsius'){
            tempValue.innerHTML = `${Math.round(data.current.temperature_2m)}°C`;
            return;
        }
        if (selected.value ==='fahrenheit') {
            const tempCelsius = `${Math.round(data.current.temperature_2m)}`;
            const celsius = parseFloat(tempCelsius)
            if(!isNaN(celsius)){
                const fahrenheit =Math.round((celsius * 9/5) + 32);
                tempValue.innerHTML = `${fahrenheit}℉`
            }else {
                tempValue.innerHTML = `${Math.round(data.current.temperature_2m)}°C`;
            }
            
        }
    }
    updateTemperature()

    tempRadios.forEach(radio =>{
        radio.addEventListener('change', updateTemperature);
    });

   // tempValue.innerHTML = `${Math.round(data.current.temperature_2m)}°C`;
    
    // Weather icon
    tempImg.innerHTML = `${getWeatherIcon(data.current.weather_code)}`;
    
    // Feel like (you need to add apparent_temperature to API request if you want this)
    feelLike.innerHTML = `--`;
    
    // Humidity
    humidity.innerHTML = `${data.current.relative_humidity_2m}%`;
    
    // Wind speed
    const windRadios = document.querySelectorAll('input[name="wind"]');

    function updateWindSpeed() {
    const selected = document.querySelector('input[name="wind"]:checked');

    if (!selected) {
        wind.innerHTML = `${data.current.wind_speed_10m} km/h`;
        return;
    }

    if (selected.value === "mph") {
        wind.innerHTML = `${Math.round(data.current.wind_speed_10m / 1.609)} mph`;
    } else {
        wind.innerHTML = `${data.current.wind_speed_10m} km/h`;
    }
}

// Show default on load
updateWindSpeed();

// Update when radio changes
windRadios.forEach(radio => {
    radio.addEventListener('change', updateWindSpeed);
});


// Precipitation (today's total)
const precipRadio = document.querySelectorAll('input[name="precip"]');
    function updatePrecipUnit (){
        const selected = document.querySelector('input[name="precip"]:checked')
            let precipitationHTML = '';
            if (data.daily.precipitation_sum[0] > 0) {
                precipitationHTML = `${data.daily.precipitation_sum[0]}mm`;
            } else {
                precipitationHTML = '0mm';
            }
            precipitation.innerHTML = precipitationHTML;
        if (!selected){
            precipitation.innerHTML = precipitationHTML;
            return;
        }
        if(selected.value ==='in'){
           const mm = parseFloat(precipitationHTML)
           if (!isNaN(mm)){
            const inches = (mm * 0.0337).toFixed(2);
            precipitation.innerHTML = `${inches} in`;
           }else{
             precipitation.innerHTML = "0 in"
           }
        }else{
            precipitation.innerHTML = precipitationHTML;
        }

    }
    updatePrecipUnit()
    precipRadio.forEach (radio =>{
        radio.addEventListener('change', updatePrecipUnit)
    });



    let precipitationHTML = '';
    if (data.daily.precipitation_sum[0] > 0) {
        precipitationHTML = `${data.daily.precipitation_sum[0]}mm`;
    } else {
        precipitationHTML = '0mm';
    }
    precipitation.innerHTML = precipitationHTML;
    
}


// Weather icon function (you need this)
const getWeatherIcon = (code) => {
    if (code === 0) {return`<img src="assets/images/icon-sunny.webp" alt="Sunday" width="150">`};
    if (code <= 3)  {return `<img src="assets/images/icon-partly-cloudy.webp" alt="icon-partly-cloudy" width="150">`};
    if (code <= 48) {return `<img src="assets/images/icon-fog.webp" alt="icon-fog"width="150">`};
    if (code <= 57) {return `<img src="assets/images/icon-drizzle.webp" alt="icon-drizzle"width="150">`};
    if (code <= 67) {return `<img src="assets/images/icon-rain.webp" alt="Rain" width="150">`};
    if (code <= 77) {return  `<img src="assets/images/icon-snow.webp" alt="icon-snow" width="150">`};
    if (code <= 82) {return `<img src="assets/images/icon-Rain-showers.png" alt="rain-shower" width="150">`};
    if (code <= 99) {return `<img src="assets/images/icon-storm.webp" alt="icon-storm" width="150">`};
    return `<img src="assets/images/icon-partly-cloudy.webp" alt="icon-partly-cloudy" width="150">`;
};


//getWeather(lat, lon);
