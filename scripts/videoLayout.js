let htmlStyles = window.getComputedStyle(document.querySelector("html"));
const mediaQuery = window.matchMedia('(max-device-width: 480px)');
function updateLayout() {
    let htmlStyles = window.getComputedStyle($("html"));

    let rowNum = parseInt(htmlStyles.getPropertyValue("--rowNum"));
    let gridItemsCount = document.querySelectorAll('.grid-item').length;
    
    if (mediaQuery.matches) {
        console.log('media matched');
        switch (gridItemsCount) {
            case 0:
                break;
            case 1:
                document.documentElement.style.setProperty(`--colNum`, 1);
                myVideo.className = "lvideo";
                break;
            case 2:
                document.documentElement.style.setProperty(`--gridHeight`, '57vh');
                document.documentElement.style.setProperty(`--colNum`, 2);
                myVideo.className = "lvideo";
                break;
            default:
                myVideo.className = "grid-item";
                gridItemsCount++;
                var calc = 96 / Math.ceil(gridItemsCount / 2);
                document.documentElement.style.setProperty(`--gridHeight`, calc + 'vh');
                console.log(calc);
                console.log(htmlStyles.getPropertyValue("--gridHeight"));
                document.documentElement.style.setProperty(`--colNum`, 2);
                break;
        }
        let colNum = parseInt(htmlStyles.getPropertyValue("--colNum"));
        document.documentElement.style.setProperty(`--rowNum`, Math.ceil(gridItemsCount / colNum));
    }
    else {
        switch (gridItemsCount) {
            case 1:
                document.documentElement.style.setProperty(`--colNum`, 1);
                myVideo.className = "lvideo";
                break;
            case 2:
                document.documentElement.style.setProperty(`--colNum`, 2);
                myVideo.className = "lvideo";
                break;
            case 3:
                myVideo.className = "grid-item";
                gridItemsCount++;
                document.documentElement.style.setProperty(`--colNum`, 2);
                break;
            case gridItemsCount >= 4:
                myVideo.className = "grid-item";
                gridItemsCount++;
                document.documentElement.style.setProperty(`--colNum`, 3);
                break;

        }
        let colNum = parseInt(htmlStyles.getPropertyValue("--colNum"));
        document.documentElement.style.setProperty(`--rowNum`, Math.ceil(gridItemsCount / colNum));
    }
}