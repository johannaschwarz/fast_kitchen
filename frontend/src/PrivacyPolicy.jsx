import React from 'react';
import Header from './Header.jsx';

function PrivacyPolicy() {
    return (
        <div className="main">
            <Header />
            <div className='content'>
                <h1>Datenschutzerklärung</h1>

                <h2>1. Verantwortlicher</h2>
                <p>
                    Niklas Rousset<br />
                    Firnhaberstr. 29<br />
                    86159 Augsburg<br />
                    Deutschland<br /><br />
                    E-Mail: byrousset@gmail.com
                </p>

                <h2>2. Cookies und Analyse-Tools</h2>
                <p>
                    Diese Website ist so datensparsam wie möglich konzipiert. Wir verwenden <strong>keinerlei Cookies</strong> – weder Tracking-Cookies, noch Marketing-Cookies oder technisch notwendige Cookies.
                    Zudem setzen wir keine Web-Analytics-Dienste (wie z. B. Google Analytics) ein und es werden keine Nutzungsprofile der Besucher erstellt.
                </p>

                <h2>3. Server-Logfiles</h2>
                <p>
                    Beim Aufruf dieser Website erhebt und speichert der Provider der Seiten automatisch Informationen in so genannten Server-Logfiles, die Ihr Browser automatisch an uns übermittelt. Dazu gehören in der Regel:
                </p>
                <ul>
                    <li>Browsertyp und Browserversion</li>
                    <li>verwendetes Betriebssystem</li>
                    <li>Referrer URL (die zuvor besuchte Seite)</li>
                    <li>Hostname des zugreifenden Rechners</li>
                    <li>Datum und Uhrzeit der Serveranfrage</li>
                    <li>IP-Adresse</li>
                </ul>
                <p>
                    Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung, der Fehleranalyse, der Abwehr von Missbrauch und der Optimierung seiner Website – hierzu müssen die Server-Logfiles erfasst werden. Die Daten werden nach einer kurzen, vom Hostinganbieter festgelegten Frist automatisch gelöscht, sofern keine weitere Aufbewahrung zu Beweiszwecken erforderlich ist.
                </p>

                <h2>4. Hosting und Auftragsverarbeitung</h2>
                <p>
                    Wir hosten unsere Website bei externen Anbietern. Die in den Server-Logfiles erfassten Daten werden auf den Servern dieser Hoster in Deutschland gespeichert. Der Einsatz der Hoster erfolgt im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch professionelle Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
                </p>
                <p>
                    <strong>IONOS</strong><br />
                    IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, Deutschland.<br />
                    Weitere Informationen zum Datenschutz bei IONOS finden Sie unter: <a href="https://www.ionos.de/terms-gtc/terms-privacy" target="_blank" rel="noreferrer">https://www.ionos.de/terms-gtc/terms-privacy</a>.
                </p>
                <p>
                    <strong>webgo</strong><br />
                    webgo GmbH, Wandsbeker Zollstraße 95, 22041 Hamburg, Deutschland.<br />
                    Weitere Informationen zum Datenschutz bei webgo finden Sie unter: <a href="https://www.webgo.de/datenschutz/" target="_blank" rel="noreferrer">https://www.webgo.de/datenschutz/</a>.
                </p>
                <p>
                    Um eine datenschutzkonforme Verarbeitung zu gewährleisten, haben wir mit beiden Hostern Verträge über die Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO geschlossen.
                </p>

                <h2>5. Ihre Rechte (Betroffenenrechte)</h2>
                <p>
                    Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung (Art. 15 DSGVO) sowie ein Recht auf Berichtigung (Art. 16 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO) oder Löschung dieser Daten (Art. 17 DSGVO).
                </p>
                <p>
                    Zudem haben Sie das Recht, der Verarbeitung Ihrer Daten zu widersprechen (Art. 21 DSGVO) sowie das Recht auf Datenübertragbarkeit (Art. 20 DSGVO).
                </p>
                <p>
                    Bei Fragen hierzu sowie zu weiteren Themen rund um den Datenschutz können Sie sich jederzeit an die oben unter "Verantwortlicher" angegebene Adresse wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu (Art. 77 DSGVO).
                </p>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
