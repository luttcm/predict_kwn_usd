document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    toggleLoadingState(true);
    
    addScrollAnimation();
    
    fetchPredictionData();
    
    document.getElementById('refresh-btn').addEventListener('click', function() {
        toggleLoadingState(true);
        fetchPredictionData(true);
    });
}

function toggleLoadingState(isLoading) {
    document.getElementById('loading').style.display = isLoading ? 'flex' : 'none';
    document.getElementById('chart').style.display = isLoading ? 'none' : 'block';
    document.getElementById('stats').style.display = isLoading ? 'none' : 'block';
    document.getElementById('error-message').style.display = 'none';
}

function fetchPredictionData(isRefresh = false) {
    const endpoint = '/predict' + (isRefresh ? '?refresh=true' : '');
    
    fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сети');
            }
            return response.json();
        })
        .then(data => {
            toggleLoadingState(false);
            
            renderChart(data);
            updateStats(data);
            
            if (isRefresh) {
                showNotification('Данные успешно обновлены!', 'success');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            toggleLoadingState(false);
            document.getElementById('error-message').textContent = 'Произошла ошибка при загрузке данных';
            document.getElementById('error-message').style.display = 'block';
            
            if (isRefresh) {
                showNotification('Не удалось обновить данные', 'error');
            }
        });
}

function renderChart(data) {
    const history = data.history;
    const prediction = data.prediction;
    
    const dates = history.map(item => item.date);
    const rates = history.map(item => item.rate);
    
    const lastDate = new Date(dates[dates.length - 1]);
    const predDate = new Date(lastDate);
    predDate.setDate(lastDate.getDate() + 3);
    
    const formattedPredDate = predDate.toISOString().split('T')[0];
    
    Plotly.newPlot('chart', [
        {
            x: dates,
            y: rates,
            name: 'Исторические данные',
            mode: 'lines+markers',
            line: {
                color: '#4361ee',
                width: 3,
                shape: 'spline'
            },
            marker: {
                color: '#3a0ca3',
                size: 6
            }
        }, 
        {
            x: [formattedPredDate],
            y: [prediction],
            name: 'Прогноз на 3 дня',
            mode: 'markers',
            marker: {
                color: '#e74c3c',
                size: 12,
                symbol: 'star'
            }
        }
    ], {
        title: 'Курс KRW/USD с прогнозом',
        titlefont: {
            family: 'Roboto, sans-serif',
            size: 24,
            color: '#2b2d42'
        },
        xaxis: {
            title: 'Дата',
            titlefont: {
                family: 'Roboto, sans-serif',
                size: 16
            },
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: 'Курс',
            titlefont: {
                family: 'Roboto, sans-serif',
                size: 16
            },
            gridcolor: '#f0f0f0'
        },
        autosize: true,
        margin: {
            l: 50,
            r: 30,
            b: 80,
            t: 100
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        hoverlabel: {
            bgcolor: '#FFF',
            font: {
                family: 'Roboto, sans-serif',
                size: 14
            }
        },
        showlegend: true,
        legend: {
            x: 0,
            y: 1.1,
            orientation: 'h'
        }
    });

    window.addEventListener('resize', function() {
        Plotly.relayout('chart', {
            'xaxis.autorange': true,
            'yaxis.autorange': true
        });
    });
}

function updateStats(data) {
    const history = data.history;
    const prediction = data.prediction;
    
    const lastRate = history[history.length - 1].rate;
    
    const percentChange = ((prediction - lastRate) / lastRate * 100).toFixed(2);
    const direction = percentChange >= 0 ? 'up' : 'down';
    
    animateValue('current-rate', 0, lastRate, 1000, 2);
    animateValue('predicted-rate', 0, prediction, 1000, 2);
    
    document.getElementById('percent-change').textContent = `${Math.abs(percentChange)}%`;
    document.getElementById('percent-change').className = `stat-value ${direction}`;
    document.getElementById('trend-icon').className = `fas fa-arrow-${direction}`;
    
    const mean = history.reduce((sum, item) => sum + item.rate, 0) / history.length;
    animateValue('average-rate', 0, mean, 1000, 2);
    
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleString();
}

function animateValue(id, start, end, duration, decimals = 0) {
    const obj = document.getElementById(id);
    const range = end - start;
    const minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    
    stepTime = Math.max(stepTime, minTimer);
    
    const startTime = new Date().getTime();
    const endTime = startTime + duration;
    let timer;
    
    function run() {
        const now = new Date().getTime();
        const remaining = Math.max((endTime - now) / duration, 0);
        const value = end - (remaining * range);
        obj.textContent = value.toFixed(decimals);
        if (value == end) {
            clearInterval(timer);
        }
    }
    
    timer = setInterval(run, stepTime);
    run();
}

function addScrollAnimation() {
    const elements = document.querySelectorAll('.stat-card, .card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(element => {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        observer.observe(element);
    });
    
    document.addEventListener('scroll', () => {
        elements.forEach(element => {
            const position = element.getBoundingClientRect();
            
            if (position.top < window.innerHeight && position.bottom >= 0) {
                element.style.opacity = "1";
                element.style.transform = "translateY(0)";
            }
        });
    });
}

function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '5px';
        notification.style.color = 'white';
        notification.style.fontWeight = '500';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        notification.style.transform = 'translateX(150%)';
        notification.style.transition = 'transform 0.3s ease';
        document.body.appendChild(notification);
    }
    
    if (type === 'success') {
        notification.style.backgroundColor = '#2ecc71';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    } else {
        notification.style.backgroundColor = '#3498db';
    }
    
    notification.textContent = message;
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(150%)';
    }, 3000);
} 