const edgeChromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const get_faculty = require("../database_calls/get_faculty");
const set_faculty = require("../database_calls/set_faculty");

const LOCAL_CHROME_EXECUTABLE = `C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe`;

async function scrap_faculty(department) {
    const URL = `https://www.lus.ac.bd/faculty-of-${department}/`;

    const executablePath =
        (await edgeChromium.executablePath) || LOCAL_CHROME_EXECUTABLE;

    const browser = await puppeteer.launch({
        executablePath,
        args: edgeChromium.args,
        headless: true,
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    try {
        await page.goto(URL, { timeout: 7000 });
        const teacherDivs = await page.$$(".teacher-info");
        const allFaculty = [];
        for (let i = 0; i < teacherDivs.length; i++) {
            const facultyName = await teacherDivs[i].$eval(
                "a",
                (a) => a.innerText
            );
            const facultyURL = await teacherDivs[i].$eval("a", (a) => a.href);
            const facultyDesignation = await teacherDivs[i].$eval("p", (p) =>
                p.innerText.replace(/[\r\n]/gm, "")
            );
            const facultyImg = await teacherDivs[i].$eval(
                "img",
                (img) => img.src
            );
            let eachFaculty = {
                name: facultyName,
                url: facultyURL,
                designation: facultyDesignation,
                image: facultyImg,
            };
            allFaculty.push(eachFaculty);
        }
        await set_faculty(department, allFaculty);
        await browser.close();

        return allFaculty;
    } catch (error) {
        return await get_faculty(department);
    }
}

module.exports = scrap_faculty;