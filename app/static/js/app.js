document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('chart').style.display = 'none';
    document.getElementById('stats').style.display = 'none';
    
    fetch('/predict')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сети');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('chart').style.display = 'block';
            document.getElementById('stats').style.display = 'block';
            
            renderChart(data);
            updateStats(data);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error-message').textContent = 'Произошла ошибка при загрузке данных';
            document.getElementById('error-message').style.display = 'block';
        });
});

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
                color: '#3498db',
                width: 2
            },
            marker: {
                color: '#2c3e50',
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
            size: 24
        },
        xaxis: {
            title: 'Дата',
            titlefont: {
                family: 'Roboto, sans-serif',
                size: 18
            }
        },
        yaxis: {
            title: 'Курс',
            titlefont: {
                family: 'Roboto, sans-serif',
                size: 18
            }
        },
        autosize: true,
        margin: {
            l: 50,
            r: 50,
            b: 80,
            t: 100
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        hoverlabel: {
            bgcolor: '#FFF',
            font: {
                family: 'Roboto, sans-serif',
                size: 16
            }
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
    
    document.getElementById('current-rate').textContent = lastRate.toFixed(2);
    document.getElementById('predicted-rate').textContent = prediction.toFixed(2);
    document.getElementById('percent-change').textContent = `${Math.abs(percentChange)}%`;
    document.getElementById('percent-change').className = `stat-value ${direction}`;
    document.getElementById('trend-icon').className = `fas fa-arrow-${direction}`;
    
    const mean = history.reduce((sum, item) => sum + item.rate, 0) / history.length;
    document.getElementById('average-rate').textContent = mean.toFixed(2);
}

document.getElementById('refresh-btn').addEventListener('click', function() {
    location.reload();
}); 