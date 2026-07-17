# krun branch status

The plugin API is krun/vsock compatible, but capture semantics are not yet
equivalent. A KVM guest sees its own `eth0` and loopback interfaces; it cannot
capture arbitrary SPR host interfaces merely because the OCI service used
`network_mode: host`.

A complete migration needs a capability-limited host capture agent that
opens the selected host interface and streams pcap records into the guest
over a dedicated vsock channel. Until then this branch must not be used as a
replacement for host-wide capture.
