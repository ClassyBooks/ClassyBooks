import { useState } from "react";
import "../../App.css";
import TeacherNavbar from '../teacher/teacherNavbar';
import { getCookie, getISBN, post, Toast } from "../../functions";
import crypto from "crypto-js";
import subtractObject from "subtract-object";
import * as XLSX from "xlsx";



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
            reader.onload = (e) => {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                setData(json);
            };
            reader.readAsBinaryString(selectedFile);



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
        const e0 = document.getElementById('0')?.value
        const e1 = document.getElementById('1')?.value
        const e2 = document.getElementById('2')?.value
        const e3 = document.getElementById('3')?.value
        const e4 = document.getElementById('4')?.value
        const e5 = document.getElementById('5')?.value
        const e6 = document.getElementById('6')?.value

        const sessionid = getCookie(`sessionId`)

        for (let i = 0; i < data.length; i++) {
            const element = Object.values(data[i]);

            let pass
            let body = { sessionid, name: ``, surname: ``, sha256: ``, md5: ``, privilege: ``, cls: ``, classNum: ``, readinglevel: `` }
            if (e0 === `Voornaam`) body.name = element[0]
            if (e0 === `Achternaam`) body.surname = element[0]
            if (e0 === `Wachtwoord`) pass = element[0]
            if (e0 === `Klas`) body.cls = element[0]
            if (e0 === `Nummer`) body.classNum = element[0]
            if (e0 === `Leesniveau`) body.readinglevel = element[0]
            if (e0 === `Gebruikerstype`) body.privilege = element[0]

            if (e1 === `Voornaam`) body.name = element[1]
            if (e1 === `Achternaam`) body.surname = element[1]
            if (e1 === `Wachtwoord`) pass = element[1]
            if (e1 === `Klas`) body.cls = element[1]
            if (e1 === `Nummer`) body.classNum = element[1]
            if (e1 === `Leesniveau`) body.readinglevel = element[1]
            if (e1 === `Gebruikerstype`) body.privilege = element[1]

            if (e2 === `Voornaam`) body.name = element[2]
            if (e2 === `Achternaam`) body.surname = element[2]
            if (e2 === `Wachtwoord`) pass = element[2]
            if (e2 === `Klas`) body.cls = element[2]
            if (e2 === `Nummer`) body.classNum = element[2]
            if (e2 === `Leesniveau`) body.readinglevel = element[2]
            if (e2 === `Gebruikerstype`) body.privilege = element[2]

            if (e3 === `Voornaam`) body.name = element[3]
            if (e3 === `Achternaam`) body.surname = element[3]
            if (e3 === `Wachtwoord`) pass = element[3]
            if (e3 === `Klas`) body.cls = element[3]
            if (e3 === `Nummer`) body.classNum = element[3]
            if (e3 === `Leesniveau`) body.readinglevel = element[3]
            if (e3 === `Gebruikerstype`) body.privilege = element[3]

            if (e4 === `Voornaam`) body.name = element[4]
            if (e4 === `Achternaam`) body.surname = element[4]
            if (e4 === `Wachtwoord`) pass = element[4]
            if (e4 === `Klas`) body.cls = element[4]
            if (e4 === `Nummer`) body.classNum = element[4]
            if (e4 === `Leesniveau`) body.readinglevel = element[4]
            if (e4 === `Gebruikerstype`) body.privilege = element[4]

            if (e5 === `Voornaam`) body.name = element[5]
            if (e5 === `Achternaam`) body.surname = element[5]
            if (e5 === `Wachtwoord`) pass = element[5]
            if (e5 === `Klas`) body.cls = element[5]
            if (e5 === `Nummer`) body.classNum = element[5]
            if (e5 === `Leesniveau`) body.readinglevel = element[5]
            if (e5 === `Gebruikerstype`) body.privilege = element[5]

            if (e6 === `Voornaam`) body.name = element[6]
            if (e6 === `Achternaam`) body.surname = element[6]
            if (e6 === `Wachtwoord`) pass = element[6]
            if (e6 === `Klas`) body.cls = element[6]
            if (e6 === `Nummer`) body.classNum = element[6]
            if (e6 === `Leesniveau`) body.readinglevel = element[6]
            if (e6 === `Gebruikerstype`) body.privilege = element[6]

            if (body.privilege === 0) {
                body.sha256 = crypto.SHA256(body.cls + body.classNum + pass).toString()
                body.md5 = crypto.MD5(body.cls + body.classNum + pass + body.sha256).toString()
            } else {
                body.sha256 = crypto.SHA256(body.name + body.surname + pass).toString()
                body.md5 = crypto.MD5(body.name + body.surname + pass + body.sha256).toString()
            }
            body.classNum = parseInt(body.classNum)
            body.privilege = parseInt(body.privilege)
            await post('/api/createUser', body)
        }

        setShowToast(true)
        setToastMessage(`Gebruikers toegevoegd`)
        setToastType(`info`)

    }

    async function handleSubmitM() {

        const sessionid = getCookie(`sessionId`)


        for (let i = 0; i < data.length; i++) {
            const element = Object.values(data[i]);
            let Bvin
            let body = { sessionid, description: {} }

            const keys = getAllKeys(data).length

            //gets all info it can get
            for (let i = 0; i < keys; i++) {
                const e = document.getElementById(i)?.value
                if (e === `ISBN`) body.isbn = element[i]
                if (e === `Booksource id`) Bvin = element[i]

            }
            body.available = 1

            if (Bvin != null) {
                body.description.cover = (`https://classroom.booksource.com/Classroom/DisplayCustomImage.aspx?BC2019=true&img=` + Bvin + `&classid=be221081-74ac-4fdf-af8c-5802f9e38e5e`)
            }

            const response = await getISBN(body.isbn)
            console.log(!!response)
            if (!!response) {
                body.title = response.title
                body.description.author = await response.authors?.toString()
                body.description.pages = response.pageCount
            }

            //replaces hardcoded info
            for (let i = 0; i < keys; i++) {
                const e = document.getElementById(i)?.value
                if (e === `Titel`) body.title = element[i]
                if (e === `Locatie`) body.place = element[i]
                if (e === `Auteur`) body.description.author = element[i]
                if (e === `Url naar afbeelding cover`) body.description.cover = element[i]
                if (e === `Aantal pagina's`) body.description.pages = parseInt(element[i])
                if (e === `Leesniveau`) body.description.readinglevel = element[i]
            }
            console.log(body)
            console.log(await post('/api/createMaterial', body))
        }

        setShowToast(true)
        setToastMessage(`Boeken toegevoegd`)
        setToastType(`info`)

    }

    return (
        <div>
            {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() =>setShowToast(false)}
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
