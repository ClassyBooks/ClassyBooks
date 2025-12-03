import { useState } from "react";
import "../../App.css";
import TeacherNavbar from '../teacher/teacherNavbar';
import { getCookie, getISBN, post, Toast } from "../../functions";
import crypto from "crypto-js";
import subtractObject from "subtract-object";
import ExcelJS from 'exceljs';


const gebruikers = [``, `Voornaam`, `Achternaam`, `Wachtwoord`, `Klas`, `Nummer`, `Leesniveau`, `Gebruikerstype`]
const boeken = [``, `Titel`, `Locatie`, `Auteur`, `Url naar afbeelding cover`, `Aantal pagina's`, `Leesniveau`, `ISBN`, `Booksource id`]


const JsonImport = () => {
    const [data, setData] = useState(null); // State for holding JSON data
    const [dataType, setDataType] = useState(`users`)
    const [all, setAll] = useState(gebruikers)
    const [used, setUsed] = useState([])
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState(``)
    const [toastType, setToastType] = useState(``)

    async function batchRequests(items, batchSize, handler) {
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);

            // Wacht tot álle requests in de batch klaar zijn
            await Promise.all(batch.map(handler));
        }
    }

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const jsonData = await response.json();
            setData(jsonData); // Update state with fetched JSON data
        } catch (error) {
            console.error("Unable to fetch data:", error);
        }
    }

    function handleFile(event) {
        const selectedFile = event.target.files[0]; // Access the file from the input element


        let url = URL.createObjectURL(selectedFile)

        if (selectedFile.type === `application/json`) {
            fetchData(url)
        } else if (selectedFile.type === `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` || `application/vnd.ms-excel` || `.csv`) {

            const reader = new FileReader();
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;

                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(arrayBuffer);

                const worksheet = workbook.worksheets[0];

                const rows = [];
                const header = worksheet.getRow(1).values.slice(1);

                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; 
                    const data = {};
                    row.values.slice(1).forEach((cell, i) => {
                        data[header[i]] = cell;
                    });
                    rows.push(data);
                });

                setData(rows);
            };

            reader.readAsArrayBuffer(selectedFile);



        }
    }

    function getAllKeys(data) {
        const keys = new Set();
        data.forEach(item => {
            Object.keys(item).forEach(key => keys.add(key));
        });
        return Array.from(keys);
    }

    function getHeadings(data) {
        if (!Array.isArray(data) || data.length === 0) return null; // Return early if data is not an array or is empty

        const keys = getAllKeys(data);



        return keys.map(key => {
            return <th><select name={keys.indexOf(key)} id={keys.indexOf(key)}>
                {subtractObject(used, all).map(e => {
                    return <option value={e}>{e}
                    </option>
                })}</select></th>;
        });
    }
    function getRows(data) {
        if (!Array.isArray(data)) return null; // Return early if data is not an array


        return data.map((obj, index) => {
            return <tr key={index}>{getCells(obj)}</tr>;
        });
    }

    function getCells(obj) {

        return Object.values(obj).map((value, index) => {
            return <td key={index}>{value}</td>;
        });
    }


    function handleType(event) {
        const {
            selectedIndex,
            options
        } = event.currentTarget;
        const selectedOption = options[selectedIndex].value;
        setDataType(selectedOption)

        if (selectedOption === `users`) {
            setAll(gebruikers)
            setUsed([])
        } else if (selectedOption === `materials`) {
            setAll(boeken)
            setUsed([])
        }
    }

    async function handleSubmitU() {
        const fieldMap = Array.from({ length: 7 }, (_, i) => document.getElementById(String(i))?.value);
        const sessionid = getCookie(`sessionId`);

        async function handleSingleUser(element) {
            const values = Object.values(element);
            let pass = "";
            let body = { sessionid, name: ``, surname: ``, sha256: ``, md5: ``, privilege: ``, cls: ``, classNum: ``, readinglevel: `` };

            values.forEach((val, idx) => {
                const field = fieldMap[idx];
                if (!field) return;

                if (field === `Voornaam`) body.name = val;
                if (field === `Achternaam`) body.surname = val;
                if (field === `Wachtwoord`) pass = val;
                if (field === `Klas`) body.cls = val;
                if (field === `Nummer`) body.classNum = val;
                if (field === `Leesniveau`) body.readinglevel = val;
                if (field === `Gebruikerstype`) body.privilege = val;
            });

            // hashes
            if (body.privilege === 0) {
                body.sha256 = crypto.SHA256(body.cls + body.classNum + pass).toString();
                body.md5 = crypto.MD5(body.cls + body.classNum + pass + body.sha256).toString();
            } else {
                body.sha256 = crypto.SHA256(body.name + body.surname + pass).toString();
                body.md5 = crypto.MD5(body.name + body.surname + pass + body.sha256).toString();
            }

            body.classNum = parseInt(body.classNum);
            body.privilege = parseInt(body.privilege);

            return post('/api/createUser', body);
        }

        await batchRequests(data, 10, handleSingleUser); // <-- batching hier

        setShowToast(true);
        setToastMessage(`Gebruikers toegevoegd`);
        setToastType(`info`);
    }


    async function handleSubmitM() {
        const sessionid = getCookie(`sessionId`);
        const keys = getAllKeys(data).length;

        async function handleSingleMaterial(element) {
            const values = Object.values(element);
            let Bvin;
            let body = { sessionid, description: {}, available: 1 };

            for (let i = 0; i < keys; i++) {
                const field = document.getElementById(i)?.value;
                if (!field) continue;

                if (field === `ISBN`) body.isbn = values[i];
                if (field === `Booksource id`) Bvin = values[i];
            }

            if (Bvin != null) {
                body.description.cover =
                    `https://classroom.booksource.com/Classroom/DisplayCustomImage.aspx?BC2019=true&img=${Bvin}&classid=be221081-74ac-4fdf-af8c-5802f9e38e5e`;
            }

            // automatisch aanvullen via ISBN
            const response = await getISBN(body.isbn);
            if (response) {
                body.title = response.title;
                body.description.author = response.authors?.toString();
                body.description.pages = response.pageCount;
            }

            // overrides vanuit import
            for (let i = 0; i < keys; i++) {
                const field = document.getElementById(i)?.value;

                if (!field) continue;

                if (field === `Titel`) body.title = values[i];
                if (field === `Locatie`) body.place = values[i];
                if (field === `Auteur`) body.description.author = values[i];
                if (field === `Url naar afbeelding cover`) body.description.cover = values[i];
                if (field === `Aantal pagina's`) body.description.pages = parseInt(values[i]);
                if (field === `Leesniveau`) body.description.readinglevel = values[i];
            }

            return post('/api/createMaterial', body);
        }

        await batchRequests(data, 10, handleSingleMaterial); // <-- batching hier

        setShowToast(true);
        setToastMessage(`Boeken toegevoegd`);
        setToastType(`info`);
    }


    return (
        <div>
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    duration={3000}
                    onClose={() => setShowToast(false)}
                />
            )}
            <nav><TeacherNavbar /></nav>
            <div>
                <select name="type" id="type" onChange={handleType} value={dataType}>
                    <option value="users" selected>Gebruikers</option>
                    <option value="materials">Boeken</option>
                </select>
                <label htmlFor="type">importeren</label>

                <p>{dataType}</p>


                <br />
                <input
                    type="file"
                    name="file"
                    id="fileInput"
                    accept="application/json, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFile}
                />

                <button type="button" onClick={() => {
                    if (dataType === `users`) {
                        handleSubmitU()
                    } else if (dataType === `materials`) { handleSubmitM() }
                }}>importeren</button>

                <div id="preview">
                    {data ? (
                        <table>
                            <thead>
                                <tr>{getHeadings(data)}</tr>
                            </thead>
                            <tbody>{getRows(data)}</tbody>
                        </table>
                    ) : (
                        <p>Geen data gevonden</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default JsonImport;
