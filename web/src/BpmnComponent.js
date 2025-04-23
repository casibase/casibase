// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import React, {useEffect, useRef, useState} from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import {BpmnPropertiesPanelModule, BpmnPropertiesProviderModule, CamundaPlatformPropertiesProviderModule} from "bpmn-js-properties-panel";
import camundaModdle from "camunda-bpmn-moddle/resources/camunda";
import "@bpmn-io/properties-panel/assets/properties-panel.css";
import "diagram-js/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn.css";
import {Button} from "antd";

const DegaultDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" id="Definitions_1ihw2m0" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.3.1">
  <bpmn:process id="Process_0ytc8h8" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1di279l" />
    <bpmn:intermediateThrowEvent id="Event_1qj6rzv" />
    <bpmn:intermediateThrowEvent id="Event_04smgb6" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_0ytc8h8">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions> `;

function BpmnComponent({diagramXML, onLoading, onError, onXMLChange}) {
  const containerRef = useRef(null);
  const propertiesPanelRef = useRef(null);
  const modelerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentViewbox, setCurrentViewbox] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Save current view state
  const saveViewbox = () => {
    if (modelerRef.current) {
      const canvas = modelerRef.current.get("canvas");
      const viewbox = canvas.viewbox();
      setCurrentViewbox(viewbox);
    }
  };

  // Restore view state
  const restoreViewbox = () => {
    if (modelerRef.current && currentViewbox) {
      const canvas = modelerRef.current.get("canvas");
      canvas.viewbox(currentViewbox);
    }
  };
  const handleExport = async() => {
    if (modelerRef.current) {
      try {
        const {xml} = await modelerRef.current.saveXML({format: true});
        const blob = new Blob([xml], {type: "application/xml"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "diagram.bpmn";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to export BPMN file:", err);
        onError && onError(err);
      }
    }
  };
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  // Add fullscreen functionality
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const elem = containerRef.current.parentElement.parentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Add zoom functionality
  const zoom = (direction) => {
    if (modelerRef.current) {
      const canvas = modelerRef.current.get("canvas");
      const currentZoom = canvas.zoom();
      const newZoom = direction === "in" ? currentZoom + 0.1 : currentZoom - 0.1;
      canvas.zoom(newZoom);
    }
  };

  useEffect(() => {
    // Ensure container exists
    if (!containerRef.current) {
      // eslint-disable-next-line no-console
      console.error("Container element not found");
      return;
    }
    modelerRef.current = new BpmnModeler({
      container: containerRef.current,
      propertiesPanel: {
        parent: propertiesPanelRef.current,
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        CamundaPlatformPropertiesProviderModule,
      ],
      moddleExtensions: {
        camunda: camundaModdle,
      },
    });
    modelerRef.current.on("element.changed", async(event) => {
      const canvas = modelerRef.current.get("canvas");
      const element = event.element;
      if (!element || !element.parent || !canvas.getRootElement().id === element.parent.id) {
        return;
      }
      try {
        saveViewbox();
        const {xml} = await modelerRef.current.saveXML({format: true});
        onXMLChange && onXMLChange(xml);
        restoreViewbox();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save XML:", err);
        onError && onError(err);
      }
    });
    // Use provided diagramXML or fallback to default
    const xmlToImport = diagramXML || DegaultDiagram;
    modelerRef.current.importXML(xmlToImport)
      .then(() => {
        restoreViewbox();
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error("Failed to import diagram:", err);
        if (onError) {
          onError(err);
        }
      });

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
      }
    };
  }, [diagramXML, onLoading, onError, onXMLChange]);

  return (
    <div style={{display: "flex", flexDirection: "column", width: "100%", height: isFullscreen ? "100vh" : "600px"}}>
      <div style={{marginBottom: 8}}>
        <Button size="small" onClick={() => zoom("in")}>Zoom In</Button>
        <Button size="small" onClick={() => zoom("out")} style={{marginLeft: 4}}>Zoom Out</Button>
        <Button size="small" onClick={toggleFullscreen} style={{marginLeft: 4}}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </Button>
        <Button size="small" onClick={handleExport} style={{marginLeft: 4}}>Export</Button>
        <Button size="small" onClick={() => setShowShortcuts(!showShortcuts)} style={{marginLeft: 4}}>Shortcuts</Button>
      </div>
      <div style={{display: "flex", width: "100%", height: "100%", backgroundColor: "white"}}>
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #ccc",
            backgroundColor: "white",
          }}
        />
        <div
          ref={propertiesPanelRef}
          style={{
            width: "20%",
            height: "100%",
            border: "1px solid #ccc",
            backgroundColor: "white",
          }}
        />
        {showShortcuts && (
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "300px",
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
          }}>
            <h3>Keyboard Shortcuts</h3>
            <table>
              <tbody>
                <tr><td><strong>ctrl + O</strong></td><td>Open local file</td></tr>
                <tr><td><strong>ctrl + S</strong></td><td>Download BPMN 2.0 diagram</td></tr>
                <tr><td><strong>ctrl + Z</strong></td><td>Undo</td></tr>
                <tr><td><strong>ctrl + ⇧ + Z</strong></td><td>Redo</td></tr>
                <tr><td><strong>ctrl + A</strong></td><td>Select all</td></tr>
                <tr><td><strong>ctrl + Scroll</strong></td><td>Vertical scroll</td></tr>
                <tr><td><strong>ctrl + ⇧ + Scroll</strong></td><td>Horizontal scroll</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BpmnComponent;
