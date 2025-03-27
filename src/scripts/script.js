/* DEFINIÇÃO DE VARIÁVEIS DE INPUT*/
const database = [
    { type: 'Eleições Gerais', shift: '1° Turno', local:'Brasil', dataSrc: geraisPrimeiroTurnoJSON },
    { type: 'Eleições Gerais', shift: '2° Turno', local:'Brasil', dataSrc: geraisSegundoTurnoJSON },
    { type: 'Eleições Municipais', shift: '1° Turno', local:'Cidade/UF', dataSrc: municipaisPrimeiroTurnoJSON },
    { type: 'Eleições Municipais', shift: '2° Turno', local:'Cidade/UF', dataSrc: municipaisSegundoTurnoJSON }
]
const votingPlace = {cityCode: '99999', cityName: 'Minha Cidade', zone: '9999', section: '9999' };
const urnaInfo = { ueId: '12345678', voters: 99 }

/* DEFINIÇÃO DE VARIÁVEIS DE TRABALHO */
let votingData;
let votingResults;
let currentTime;
let startDate;
let endDate;
const appState = {
    currentDb: {},
    currentStage: 0,
    voters: 1,
    number: '',
    btnCooldown: true,
    hasParty: false,
    candidateExist: false,

    reset(type) {
        this.number = '';
        this.btnCooldown = false;
        this.hasParty = false;
        this.candidateExist = false;

        if(type === 'full' || type === 'new'){
            this.currentStage = 0;
        }

        if(type === 'full'){
            this.currentDb = {};
            this.voters = 1;
            this.btnCooldown = true;
        }
    }
}

/* DEFINIÇÃO DE VARIÁVEIS DOS ELEMENTOS DA PÁGINA */
const getElId = (element) => document.getElementById(element);
const originalUrnaDisplay = getElId('urna-display').cloneNode(true);
const controlsBtn = getElId('control-buttons');
let elements = getElements();

const displayManager = {
    pageTitle: (text) => {
        updateUI(elements.pageTitle, text);
    },
    headFooter: (type) => {
        switch(type) {
            case 'stage':
                updateUI(elements.display.headerLeft, 'SEU VOTO PARA');
                elements.display.footer.classList.toggle('display__footer--no-border');
                elements.display.footer.classList.toggle('hide');
            break;
            case 'time':
                let footerTxt = `Município: ${votingPlace.cityCode} - ${votingPlace.cityName} _ Zona: ${votingPlace.zone} _ Seção: ${votingPlace.section}`;
                if(currentTime) clearInterval(currentTime);
                getDate();
                currentTime = setInterval(getDate, 1000);
                elements.display.footerL3.classList.toggle('footer__l3--status');
                updateUI(elements.display.footerL3, footerTxt);
            break;
        }
    },
    screen: (type) => {
        let dspMsg;
        if(type === 'blank') {
            dspMsg = 'VOTO EM BRANCO';
            elements.display.numberBox.classList.add('display-none');
            elements.display.mainMessage.classList.add('blink');
            displayManager.confirmVote();
            displayManager.headFooter('stage');
        } else if(type === 'start' || type === 'end' || type === 'saving'){ 
            switch(type) {
                case 'start':
                    dspMsg = '<p>INICIO DA VOTAÇÃO</p><p>CARREGANDO DADOS...</p>';
                break;
                case 'end':
                    dspMsg = 'FIM';
                    resetDisplay();
                    sound.end.play();
                break;
                case 'saving':
                    dspMsg = `
                    <div class="main__message__saving-bar"></div>
                    <span class="message__saving-bar__label">GRAVANDO</span>
                    `;
                    resetDisplay();
                break;
            }
            displayManager.headFooter('time');
        }

        elements.display.mainMessage.innerHTML = dspMsg;
        elements.display.mainMessage.classList.add(`main__message--${type}`);
        elements.display.mainMessage.classList.remove('display-none');
    },
    stage: (stage) => {
        let fragment = '';
        if(!votingData[stage].vice2) {
            elements.display.mainRw5.classList.add('display-none');
        }
        updateUI(elements.display.office, votingData[stage].office);
        elements.display.office.classList.remove('hide');
        for(let i=0; i < votingData[stage].digits; i++) {
            if(i === 0) {
                fragment += `<div id="number-input-${i+1}" class="display__number__input blink"> </div>`;
            } else {
                fragment += `<div id="number-input-${i+1}" class="display__number__input"> </div>`;
            }
        }
        elements.display.numberBox.innerHTML = fragment;
    },
    confirmVote: () => {
        elements.display.footerAlert.classList.remove('display-none');
        appState.btnCooldown = true;
        setTimeout(() => {
            elements.display.footerAlert.classList.add('display-none');
            appState.btnCooldown = false;
        }, 1000);
    },
    screenAlert: (type) => {
        let numMsg;
        if(type === 'legendVote' || type === 'nullCandidate') {
            updateUI(elements.display.displayAlert, 'VOTO DE LEGENDA');
            elements.display.displayAlert.classList.remove('hide');
            if(type === 'nullCandidate') {
                numMsg = 'CANDIDATO INEXISTENTE';
            }
        } 
        if(type === 'wrongNumber' || type === 'nullCandidate') {
            if(type === 'wrongNumber') {
                numMsg = 'NÚMERO ERRADO';
                updateUI(elements.display.displayAlert, 'VOTO NULO');
                elements.display.displayAlert.classList.remove('hide');
            }
            updateUI(elements.display.rw2Alert, numMsg);
            elements.display.rw2Alert.classList.remove('display-none');
            elements.display.mainRw2.classList.remove('hide');
        }
    },
    modalAlert: (type) => {
        let modalMsg;
        if(type === 'start') {
            let fragment = '';
            modalMsg = '<strong>Para Iniciar:</strong> Selecione a Eleição que Deseja Simular';
            database.forEach((value, index) => {
                fragment += `
                <div id="election-${index}" class="modal__election__card" data-key="${index}">
                    <div class="card__election__type">${value.type.toUpperCase()}</div>
                    <div class="card__election__shift">${value.shift}</div>
                </div>
                `;
            });
            elements.modal.message.classList.add('pop-up__message--title');
            elements.modal.election.classList.remove('display-none');
            elements.modal.closer.classList.add('display-none');
            elements.modal.election.innerHTML = fragment;
        } else {
            switch (type) {
                case 'numbers':
                    modalMsg = 'O número do candidato já está completo. Não é possível utilizar teclas numéricas neste momento';
                break;
                case 'blank':
                    modalMsg = 'Para votar em <strong>BRANCO</strong> o campo de voto deve estar vazio.<br/>Aperte CORRIGE para apagar o campo de voto';
                break;
                case 'correct':
                    modalMsg = 'Para utilizar o <strong>CORRIGE</strong> você deve ter digitado algum número ou ter votado em BRANCO';
                break;
                case 'confirm':
                    if(votingData[appState.currentStage].nominal) {
                        modalMsg = 'Para <strong>CONFIRMAR</strong> é necessário digitar o número do candidato ou votar em BRANCO';
                    } else {
                        modalMsg = 'Para <strong>CONFIRMAR</strong> é necessário digitar pelo menos o número do partido ou votar em BRANCO';
                    }
                break;
            }

            sound.error.play();
        }
        elements.modal.message.innerHTML = modalMsg;
        elements.modal.div.classList.remove('display-none');
        document.body.classList.add('no-scroll');
    },
    paperResults: (show) => {
        elements.paper.div.classList.toggle('display-none', !show);
    },
    controlsBtn: (show) => {
        controlsBtn.classList.toggle('display-none', !show);
    }
};

/* DEFINIÇÃO DE VARIÁVEIS DE SOM DA URNA */
const sound = {
    stage: new Audio('src/assets/sound/inter.mp3'),
    end: new Audio('src/assets/sound/fim.mp3'),
    error: new Audio('src/assets/sound/ops.mp3')
};

/* FUNÇÕES PRINCIPAIS */
function welcome() {
    displayManager.modalAlert('start');
    setModalListeners();
}

async function init(dataSrc) { 
    startDate = getDate();
    displayManager.screen('start');
    votingData = await getVotingData(dataSrc);
    votingResults = initResults(votingData);
    clearInterval(currentTime);
    votingStages(0);
    appState.btnCooldown = false;
}

function getVotingData(dataSrc) {
    // Lógica para importar os dados da votação por API ou DB
    return new Promise((resolve) => setTimeout(() => resolve(dataSrc), 1500));
}

function initResults(data) {
    return data.map(item => {
        const newItem = {
            office: item.office,
            nominal: item.nominal,
            candidates: Object.keys(item.candidates).reduce((acc, key) => {
                acc[key] = {
                    name: item.candidates[key].name,
                    votes: 0
                };
                return acc;
            }, {}),
            brancos: 0,
            nulos: 0
        };

        if(!item.nominal) {
            newItem.parties = Object.keys(item.parties).reduce((acc, key) => {
                acc[key] = {
                    name: item.parties[key].initials,
                    votes: 0
                };
                return acc;
            }, {});
        }
        
        return newItem;
    });
}

function votingStages(stage) {
    if(stage < votingData.length) {
        resetDisplay();
        displayManager.stage(stage);
        setPartiesList();
    } else {
        elements.list.div.classList.add('display-none');
        displayManager.screen('saving');
        setTimeout(() => {
            displayManager.screen('end');
            displayManager.controlsBtn(true)
        }, 1000);
    }
}

function registerNumber(key) {
    if(appState.number.length < votingData[appState.currentStage].digits) {
        appState.number += key;
        let currentNumberBox = getElId(`number-input-${appState.number.length}`);
        currentNumberBox.classList.remove('blink');
        updateUI(currentNumberBox, key);
        if(appState.number.length === 2) {
            appState.hasParty = searchParty(appState.number);
        }
        if(appState.number.length < votingData[appState.currentStage].digits) {
            let nextNumberBox = getElId(`number-input-${appState.number.length + 1}`);
            nextNumberBox.classList.add('blink');
        } else {
            appState.candidateExist = searchCandidate(appState.number);
        }
    }
}

function handleConfirm() {
    if(appState.number.length < votingData[appState.currentStage].digits) {
        if(!votingData[appState.currentStage].nominal) {
            if(appState.hasParty) {
                displayManager.screenAlert('legendVote')
            }
            displayManager.confirmVote();
            for(let i = appState.number.length + 1; i <= votingData[appState.currentStage].digits; i++) {
                appState.number += ' '
                getElId(`number-input-${i}`).classList.remove('blink');
                getElId(`number-input-${i}`).classList.add('number__input--disabled');
            }
        } else {
            displayManager.modalAlert('confirm');
        }
    } else {
        registerVote(appState.number, appState.currentStage);
        resetDisplay();
        appState.currentStage++;
        sound.stage.play();
        votingStages(appState.currentStage);
    }
}

function registerVote(number, stage) {
    number = number.trim();
    if(appState.hasParty) {
        if(appState.candidateExist) {
            votingResults[stage].candidates[number].votes++
        } else {
            if(!votingData[stage].nominal) {
                number = number.slice(0, 2);
                votingResults[stage].parties[number].votes++
            } else {
                votingResults[stage].nulos++
            }
        }       
    } else if(number === 'BRANCO') {
            votingResults[stage].brancos++
    } else {
        votingResults[stage].nulos++
    }
}

function newVoter() {
    appState.voters++;
    appState.reset('new');
    displayManager.screen('start');
    clearInterval(currentTime);
    votingStages(0);
}

function restartVoting() {
    clearInterval(currentTime);
    appState.reset('full');
    resetDisplay();
    displayManager.controlsBtn(false);
    displayManager.modalAlert('start');
    setModalListeners();
}

/* FUNÇÕES DE BUSCA E DISPLAY DE DADOS */
// Pesquisa de dados mostrados na tela da urna
function searchParty(number) {
    const party = votingData[appState.currentStage].parties.hasOwnProperty(number);
    if(votingData[appState.currentStage].nominal) {
        if(party) {
            updateUI(elements.display.partyInitials, votingData[appState.currentStage].parties[number].initials);
        }
    } else {
        if(party) {
            updateUI(elements.display.partyInitials, votingData[appState.currentStage].parties[number].initials);
            elements.display.mainRw3.classList.remove('hide');
        } else {
            displayManager.screenAlert('wrongNumber');
        }
        elements.display.numberLabel.classList.remove('hide');
        displayManager.headFooter('stage');
    }
    return party;
}

function searchCandidate(number) {
    const candidate = votingData[appState.currentStage].candidates.hasOwnProperty(number);
    let genderOffice;

    if(appState.hasParty) {
        if(candidate) {
            if(votingData[appState.currentStage].nominal) {
                elements.display.mainRw3.classList.remove('hide');
                displayManager.headFooter('stage');
            }

            genderOffice = checkCandidateSex();
            updateUI(elements.display.office, genderOffice);
            elements.photos.holderImg.alt = genderOffice;

            updateUI(elements.display.holderName, votingData[appState.currentStage].candidates[number].name);
            elements.photos.holderImg.src = `${votingData[appState.currentStage].photoSrc}${number}.jpg`;
            elements.photos.div.classList.remove('display-none');
            
            if(votingData[appState.currentStage].vice1) {
                searchVices();
                updateUI(elements.photos.holderLabel, genderOffice);
            }

        } else if(votingData[appState.currentStage].nominal) {
            displayManager.screenAlert('wrongNumber');
            displayManager.headFooter('stage');

        } else {
            displayManager.screenAlert('nullCandidate');
        }

    } else if(votingData[appState.currentStage].nominal) {
        displayManager.screenAlert('wrongNumber');
        displayManager.headFooter('stage');
    }

    displayManager.confirmVote();
    elements.display.mainRw2.classList.remove('hide');

    return candidate;
}

function checkCandidateSex() {
    let genderOffice;
    if(votingData[appState.currentStage].candidates[appState.number].sex === 'female') {
        genderOffice = votingData[appState.currentStage].officeFemale;
    } else {
        genderOffice = votingData[appState.currentStage].office;
    }
    return genderOffice;
}

function searchVices() {
    updateViceInfo(votingData[appState.currentStage].candidates[appState.number].vice1, appState.number, 1);
    if (votingData[appState.currentStage].vice2) updateViceInfo(votingData[appState.currentStage].candidates[appState.number].vice2, appState.number, 2);
}

function updateViceInfo(vice, number, index) {
    updateUI(elements.display[`vice${index}Label`], `${vice.role}: `);
    updateUI(elements.display[`vice${index}Name`], vice.name);
    updateUI(elements.photos[`vice${index}Label`], vice.role);
    updateUI(elements.photos[`vice${index}Img`].src = `${votingData[appState.currentStage].photoSrc}${number}-${index}.jpg`);
    updateUI(elements.display[`mainRw${index+3}`].classList.remove('hide'));
    if(index === 1) {
        elements.photos.vicesDiv.classList.remove('display-none');
    } else {
        elements.photos.vice2Div.classList.remove('display-none');
        elements.display.footerAlert.classList.remove('footer__alert--center');
    }
}

//Funções de busca de dados para exibição na cola de candidatos abaixo da urna
function setPartiesList() {
    let fragment = '';
    elements.list.head.innerHTML = 'Para visualização dos candidatos, <strong>selecione um partido</strong>:';
    Object.entries(votingData[appState.currentStage].parties).forEach(([key, value]) => {
        fragment += `
            <div class="candidates-list__card list__card--link" data-key="${key}">
                <div class="card__party__title">${key} ${value.initials}</div>
                <div class="card__party__description">${value.name}</div>
            </div>
        `;
    });
    elements.list.body.innerHTML = fragment;
    elements.list.closer.classList.add('display-none');
    elements.list.div.classList.remove('display-none');
    setListListeners();
}

function searchCandidates(obj, stage, prefix) {
    const candidatesObj = obj[stage].candidates;
    const matchCandidatesObj = Object.keys(candidatesObj)
        .filter(key => key.startsWith(prefix))
        .reduce((acc, key) => {
            acc[key] = { ...candidatesObj[key] };
            return acc;
        }, {});
    return matchCandidatesObj;
}

function showCandidates(party, list) {
    let fragment = '';
    elements.list.head.innerHTML = `${party} ${votingData[appState.currentStage].parties[party].initials} - ${votingData[appState.currentStage].parties[party].name} - <strong>${votingData[appState.currentStage].office}</strong>`;
    Object.entries(list).forEach(([key, value]) => {
        fragment += `
            <div id="list-card-candidate-${key}" class="candidates-list__card">
                <img class="card__candidate__photo" src="${votingData[appState.currentStage].photoSrc}/${key}.jpg" alt="${value.name}" />
                <span class="card__candidate__name">${value.name}</span>
                <span class="card__candidate__number">${key}</span>
            </div>
        `;
    });
    elements.list.body.innerHTML = fragment;
    elements.list.closer.classList.remove('display-none');
}


/* FUNÇÕES DE CONTROLE DE TELA */
function updateUI(element, content) {
    if(element) element.textContent = content;
}

function getElements() {
    const elmnts = {
        pageTitle: getElId('page-title'),
        urnaDisplay: getElId('urna-display'),
        display: {
            headerLeft: getElId('header-left'),
            mainMessage: getElId('display-main-msg'),
            office: getElId('display-office'),
            numberLabel: getElId('number-label'),
            numberBox: getElId('number-box'),
            mainRw2: getElId('rw2'),
            rw2Alert: getElId('rw2-alert'),
            holderName: getElId('holder-display-name'),
            mainRw3: getElId('rw3'),
            partyInitials: getElId('party-initials'),
            mainRw4: getElId('rw4'),
            vice1Label: getElId('vice1-display-label'),
            vice1Name: getElId('vice1-name'),
            mainRw5: getElId('rw5'),
            vice2Label: getElId('vice2-display-label'),
            vice2Name: getElId('vice2-name'),
            displayAlert: getElId('display-alert'),
            footer: getElId('display-footer'),
            footerAlert: getElId('footer-alert'),
            footerL1: getElId('display-footer-l1'),
            footerL2: getElId('display-footer-l2'),
            footerL3: getElId('display-footer-l3')  
        },
        photos: {
            div: getElId('display-photos'),
            holderImg: getElId('holder-img'),
            holderLabel: getElId('holder-photo-label'),
            vicesDiv: getElId('display-vices-photo'),
            vice1Img: getElId('vice1-img'),
            vice1Label: getElId('vice1-photo-label'),
            vice2Div: getElId('vice2-photo-box'),
            vice2Img: getElId('vice2-img'),
            vice2Label: getElId('vice2-photo-label')
        },
        keyboard: getElId('urna-keyboard'),
        modal: { 
            div: getElId('modal'),
            message: getElId('popup-message'),
            election: getElId('select-election'),
            closer: getElId('modal-closer')
        },
        paper: {
            div: getElId('voting-paper'),
            closer: getElId('paper-closer'),
            info: getElId('paper-voting-info'),
            body: getElId('paper-body')
        },
        list: {
            div: getElId('candidates-list-div'),
            head: getElId('candidates-list-head'),
            body: getElId('candidates-list-body'),
            closer: getElId('candidates-list-closer')
        }
    }

    return elmnts;
}

function resetDisplay() {
    appState.reset();
    elements.urnaDisplay.replaceWith(originalUrnaDisplay.cloneNode(true));
    elements = getElements();
}

function closeWelcomeModal() {
    elements.modal.div.classList.add('display-none')
    document.body.classList.remove('no-scroll');
    elements.modal.message.classList.remove('pop-up__message--title');
    elements.modal.election.classList.add('display-none');
    elements.modal.closer.classList.remove('display-none');
    elements.modal.election.innerHTML = '';
}

async function printResults() {
    elements.paper.info.innerHTML = `${appState.currentDb.type}<br/>${appState.currentDb.shift}<br/>(${getDate().toLocaleDateString()})`;

    let fragment = `
        <table class="paper__table">
            <tr>
                <td>Município</td> <td>${votingPlace.cityCode}</td>
            </tr>
            <tr>
                <td class="paper__td--center">${votingPlace.cityName.toUpperCase()}</td>
            </tr>
            <tr>
                <td>Zona Eleitoral</td> <td>${votingPlace.zone}</td>
            </tr>
            <tr>
                <td>Seção Eleitoral</td> <td>${votingPlace.section}</td>
            </tr>
        </table>

        <table class="paper__table">
            <tr>
                <td>Eleitores aptos</td> <td>${(urnaInfo.voters.toString()).padStart(4, '0')}</td>
            </tr>
            <tr>
                <td>Comparecimento</td> <td>${(appState.voters.toString()).padStart(4, '0')}</td>
            </tr>
            <tr>
                <td>Eleitores faltosos</td> <td>${((urnaInfo.voters - appState.voters).toString()).padStart(4, '0')}</td>
            </tr>
        </table>

        <table class="paper__table">
            <tr>
                <td>Código de Identificação UE</td> <td>${urnaInfo.ueId}</td>
            </tr>
            <tr>
                <td>Data de Abertura da UE</td> <td>${startDate.toLocaleDateString()}</td>
            </tr>
            <tr>
                <td>Horário de Abertura da UE</td> <td>${startDate.toLocaleTimeString()}</td>
            </tr>
            <tr>
                <td>Data de Fechamento da UE</td> <td>${endDate.toLocaleDateString()}</td>
            </tr>
            <tr>
                <td>Horário de Fechamento da UE</td> <td>${endDate.toLocaleTimeString()}</td>
            </tr>
        </table>

        <table class="paper__table">
            <tr>
                <td>Código Verificador: </td> <td>${generateVerifyId()}</td>
            </tr>
        </table>
    `;
    
    votingResults.forEach((value, index) => {
        let nominalVotes = 0;
        let totalPartyVotes = 0;

        fragment += `
            <div class="paper__results__title">
                --------------------------------------------
                <span class="paper__results__title__txt"> ${value.office.toUpperCase()} </span>
            </div>
        `;
        if(value.nominal) {
            fragment += `
                <table class="paper__table paper__results">
                    <tr>
                        <th>Nome do candidato</th> <th>Num cand</th> <th>Votos</th>
                    </tr>
            `;
            Object.entries(value.candidates).forEach(([key, value]) => {
                fragment += `
                    <tr>
                        <td>${value.name}</td> <td>${key}</td> <td>${(value.votes.toString()).padStart(4, '0')}</td>
                    </tr>
                `;
                nominalVotes += value.votes
            });
            fragment += `
                </table>
                --------------------------------------------
                <table class="paper__table">
                    <tr>
                        <td>Eleitores aptos</td> <td>${(urnaInfo.voters.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Total de votos Nominais</td> <td>${(nominalVotes.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Brancos</td> <td>${(value.brancos.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Nulos</td> <td>${(value.nulos.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Total apurado</td> <td>${((nominalVotes + value.brancos + value.nulos).toString()).padStart(4, '0')}</td>
                    </tr>
                </table>
                <table class="paper__table">
                    <tr>
                        <td>Código Verificador: </td> <td>${generateVerifyId()}</td>
                    </tr>
                </table>
            `;
        } else {
            Object.entries(value.parties).forEach(([key, value]) => {
                const matchCandidates = searchCandidates(votingResults, index, key);
                let partyVotes = value.votes;
                totalPartyVotes += value.votes;

                fragment += `
                    <table class="paper__table paper__results">
                        <tr>
                            <th>Partido: ${key} - ${value.name}</th>
                        </tr>
                        <tr>
                            <th>Nome do candidato</th> <th>Num cand</th> <th>Votos</th>
                        </tr>
                `;
                
                Object.entries(matchCandidates).forEach(([key, value]) => {
                    fragment += `
                        <tr>
                            <td>${value.name}</td> <td>${key}</td> <td>${(value.votes.toString()).padStart(4, '0')}</td>
                        </tr>
                    `;
                    partyVotes += value.votes;
                    nominalVotes += value.votes;
                });
                
                fragment += `
                        <table class="paper__table">
                            <tr>
                                <td>Votos de legenda:</td> <td>${(value.votes.toString()).padStart(4, '0')}</td>
                            </tr>
                            <tr>
                                <td>Total do partido:</td> <td>${((partyVotes).toString()).padStart(4, '0')}</td>
                            </tr>
                        </table>
                        <table class="paper__table">
                            <td class="paper__td--center">Código Verificador: ${generateVerifyId()}</td>
                        </table>
                    </table>
                `;
            });

            fragment += `
                --------------------------------------------
                <table class="paper__table">
                    <tr>
                        <td>Eleitores aptos</td> <td>${(urnaInfo.voters.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Total de votos Nominais</td> <td>${(nominalVotes.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Total de votos de Legenda</td> <td>${(totalPartyVotes.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Brancos</td> <td>${(value.brancos.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Nulos</td> <td>${(value.nulos.toString()).padStart(4, '0')}</td>
                    </tr>
                    <tr>
                        <td>Total apurado</td> <td>${((nominalVotes + totalPartyVotes + value.brancos + value.nulos).toString()).padStart(4, '0')}</td>
                    </tr>
                </table>
                <table class="paper__table">
                    <tr>
                        <td>Código Verificador: </td> <td>${generateVerifyId()}</td>
                    </tr>
                </table>
            `;
        }
    });
    const votingHash = await generateHash(fragment);
    const qrcodeURL = await generateQrCode(votingHash);
    fragment += `
        --------------------------------------------
        --------------------------------------------
        <img class="paper__qrcode" src="${qrcodeURL}" />
        <table class="paper__table">
            <tr>
                <td>ASSINATURA QR CODE:</td>
            </tr>
            <tr>
                <td class="paper__table__td--breakword">${votingHash.toUpperCase()}</td>
            </tr>
        </table>
    `;
    elements.paper.body.innerHTML = fragment;
}

/* FUNÇÕES AUXILIARES */
function getDate() {
    let fullDate = new Date();
    let currentDay = fullDate.getDay();
    currentDay = setLocalDay(currentDay);
    let localDate = `${currentDay} ${fullDate.toLocaleDateString()} ${fullDate.toLocaleTimeString()}`;
    updateUI(elements.display.headerLeft, localDate);
    return fullDate;
}

function setLocalDay(day) {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
    return days[day];
}

function generateVerifyId() {
    const number = Math.floor(1000000000 + Math.random() * 9000000000);
    return number.toLocaleString('pt-BR');
}

async function generateHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    
    // Converter para string hexadecimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
    
    return hashHex;
}

async function generateQrCode(content) {
    const url = 'https://api.qrserver.com/v1/create-qr-code/';
    const size = 'size=300x300';

    const response = await fetch(url + '?' + size + '&data=' + content)
        .catch(function(error) {
            return error;
        });
    const data = response.url;
    return data;
}

/* LISTENERS DO MODAL */
function setModalListeners() {
    document.querySelectorAll('.modal__election__card').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-key');
            const dataSrc = database[key].dataSrc;
            appState.currentDb = database[key];
            displayManager.pageTitle(`${database[key].type} ${database[key].shift} - ${database[key].local}`);
            init(dataSrc);
            closeWelcomeModal();
        });
    });

    elements.modal.closer.addEventListener('click', () => {
        elements.modal.div.classList.add('display-none')
        document.body.classList.remove('no-scroll');
    });
}

/* LISTENERS DOS BOTÕES DA URNA */
elements.keyboard.addEventListener('click', (e) => {
    const button = (element) => e.target.classList.contains(element);

    if(appState.currentStage < votingData.length) {
        if(!appState.btnCooldown) {
            if(button('urna__keyboard__number-button')) {
                registerNumber(e.target.getAttribute('data-key'));
            }

            if(button('urna__keyboard__blank')) {
                if(appState.number.length === 0) {
                    appState.number = 'BRANCO';
                    displayManager.screen('blank');
                } else {
                    displayManager.modalAlert('blank');
                }
            }

            if(button('urna__keyboard__confirm')) {
                if(appState.number.length >= 2) {
                    handleConfirm();
                } else {
                    displayManager.modalAlert('confirm');
                }
            }
        }

        if(button('urna__keyboard__correct')) {
            if(appState.number.length > 0) {
                resetDisplay();
                votingStages(appState.currentStage);
            } else {
                displayManager.modalAlert('correct');
            }
        }
    }
});

/* LISTENERS DA LISTA DE CANDIDATOS */
function setListListeners() {
    elements.list.body.addEventListener('click', (e) => {
        const linkElement = e.target.closest('.list__card--link');
        if(linkElement) {
            const key = linkElement.getAttribute('data-key');
            const matchCandidates = searchCandidates(votingData, appState.currentStage, key);
            showCandidates(key, matchCandidates);
        }
    });

    elements.list.closer.addEventListener('click', () => {
        elements.list.closer.classList.add('display-none');
        setPartiesList();
    });
}

/* LISTENERS DO BOLETIM DE URNA */
elements.paper.closer.addEventListener('click', () => {
    displayManager.paperResults(false);
    document.body.classList.remove('no-scroll');
    elements.paper.body.innerHTML = '';
    restartVoting();
});

/* LISTENERS BOTÕES DE CONTROLE DA PÁGINA */
controlsBtn.addEventListener('click', async (e) => {
    const button = (element) => e.target.classList.contains(element);
    if(button('control__button--next')) {
        newVoter();
    } else if(button('control__button--end')) {
        endDate = getDate();
        await printResults();
        document.body.classList.add('no-scroll');
        displayManager.paperResults(true);
    } else if(button('control__button--restart')) {
        restartVoting();
    }
});



/* START DA APLICAÇÃO */
welcome();